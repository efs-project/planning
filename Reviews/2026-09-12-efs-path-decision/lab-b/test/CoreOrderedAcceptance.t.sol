// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {IAcceptor, IIndexModule} from "../src/Interfaces.sol";
import {ExecutionSlots} from "../src/ExecutionSlots.sol";
import {Keys} from "../src/Keys.sol";
import {UpgradeProxy} from "./UpgradeProxy.sol";

contract EquipmentEligibility {
    bool public eligible = true;
    function set(bool value) external { eligible = value; }
}

/// Real rule: one live loadout, checked character + seven items, mutable eligibility.
/// Always resolves the active required index; historical admissions are not re-evaluated.
contract EquipmentRule is IAcceptor {
    EquipmentEligibility public immutable eligibility;
    constructor(EquipmentEligibility e) { eligibility = e; }
    function accept(bytes32 t, bytes calldata body, bytes32[] calldata refs) external view returns(bool) {
        Ledger core = Ledger(msg.sender);
        IndexModule current = IndexModule(core.indexModule());
        (uint8 status,uint64 from,uint64 through) = current.coverage(current.FAMILY_BY_TYPE(),0);
        (uint64 admission,,,) = core.counts();
        (,uint64 live,,) = current.postingHead(Keys.byTypeList(t));
        if (!eligibility.eligible() || refs.length != 8 || body.length != 288
            || status != 2 || from != 1 || through != admission || live != 0) return false;
        for (uint256 i; i < 8; ++i) {
            (,uint64 first,uint32 occurrences,) = core.record(refs[i]);
            if (first == 0 || first > admission || occurrences == 0) return false;
        }
        return true;
    }
}

contract EquipmentApplication {
    uint256 public operations;
    function equip(Ledger core, Ledger.Action[] memory a, bytes[] memory b) external {
        ++operations;
        Ledger.ReadSetV2 memory empty;
        core.executeGuarded(a,b,core.nonces(address(this)),core.executionSet(),empty);
    }
}

contract PrefixAgreementIndex is IndexModule {
    constructor(address core) IndexModule(core) {}
    function onAdmission(uint64 publication, Effect[] calldata effects) public override {
        super.onAdmission(publication,effects);
        Ledger core=Ledger(ledger);
        (uint64 count,,,uint64 pubs)=core.counts();
        require(count==lastProcessed && pubs==publication,"prefix counts diverged");
        for(uint256 i;i<effects.length;i++) {
            Effect calldata e=effects[i];
            if(e.kind==1 || e.kind==2 || e.kind==6) {
                (,,uint32 occurrences,)=core.record(e.recordId);
                (,uint64 live,,)=this.postingHead(Keys.byTypeList(e.typeId));
                require(occurrences==live,"record/index prefix differs"); // fixture: one Record per Type
            }
            if(e.kind==3 || e.kind==4) {
                (uint8 state,,uint64 admission,,,bytes32 target)=core.head(e.bindingKey);
                (,,uint64 last,)=this.postingHead(Keys.historyList(e.bindingKey));
                require(admission==e.admission && last==admission,"head/history prefix differs");
                require(e.kind==3 ? state==1 && target==e.target : state==2,"head state differs");
            }
        }
    }
}

contract PhaseRefusingIndex is IndexModule {
    bool immutable finalOnly;
    error E_PREFIX(); error E_FINAL();
    constructor(address core,bool final_) IndexModule(core) {finalOnly=final_;}
    function onAdmission(uint64 p,Effect[] calldata es) public override {
        super.onAdmission(p,es);
        if(!finalOnly && es[es.length-1].admission==2)revert E_PREFIX();
    }
    function afterPublication(uint64 p,Effect[] calldata es) public view override returns(bytes4 acknowledgement) {
        acknowledgement=super.afterPublication(p,es);
        if(finalOnly)revert E_FINAL();
    }
}

/// Negative callback fixtures deliberately pass the new metadata gate so these
/// regressions still exercise CALL/STATICCALL response handling, not an earlier
/// missing-manifest failure. Their fake manifest is NOT a readiness claim.
abstract contract CallbackMetadataProbe {
    function manifestHash() external pure returns(bytes32){return keccak256("test/negative-callback/1");}
    function fieldProfile() external pure returns(address){return address(0);}
}
/// A pre-final-phase module whose permissive fallback must NOT silently qualify.
contract LegacyFallbackIndex is CallbackMetadataProbe {
    function onAdmission(uint64,IIndexModule.Effect[] calldata) external {}
    fallback() external {}
}
contract MalformedFinalIndex is CallbackMetadataProbe {
    bool immutable longResult;
    constructor(bool long_) {longResult=long_;}
    function onAdmission(uint64,IIndexModule.Effect[] calldata) external {}
    fallback() external {
        bool longer=longResult;bytes4 magic=IIndexModule.afterPublication.selector;
        assembly ("memory-safe") { mstore(0,magic) if longer { return(0,64) } mstore(0,0) return(0,32) }
    }
}
contract MutatingRule {
    EquipmentEligibility immutable dependency;
    constructor(EquipmentEligibility d){dependency=d;}
    function accept(bytes32,bytes calldata,bytes32[] calldata) external returns(bool){dependency.set(false);return true;}
}
contract WritingFinalIndex is CallbackMetadataProbe {
    uint256 public prefixWrites;
    uint256 public finalWrites;
    function onAdmission(uint64,IIndexModule.Effect[] calldata) external {++prefixWrites;}
    function afterPublication(uint64,IIndexModule.Effect[] calldata) external returns(bytes4){
        ++finalWrites;return IIndexModule.afterPublication.selector;
    }
}
contract OversizedCallbackIndex is CallbackMetadataProbe {
    uint256 public touched;
    function onAdmission(uint64,IIndexModule.Effect[] calldata) external {
        touched=1;bytes memory result=new bytes(4097);
        assembly ("memory-safe"){return(add(result,32),4097)}
    }
    function afterPublication(uint64,IIndexModule.Effect[] calldata) external pure returns(bytes4){return IIndexModule.afterPublication.selector;}
}
contract BudgetBurningIndex is IndexModule {
    uint256 immutable prefixBurn;uint256 immutable finalBurn;
    constructor(address c,uint256 prefix_,uint256 final_)IndexModule(c){prefixBurn=prefix_;finalBurn=final_;}
    function burn(uint256 amount) private view {uint256 start=gasleft();while(start-gasleft()<amount){}}
    function onAdmission(uint64 p,Effect[] calldata es)public override{super.onAdmission(p,es);burn(prefixBurn);}
    function afterPublication(uint64 p,Effect[] calldata es)public view override returns(bytes4 acknowledgement){
        acknowledgement=super.afterPublication(p,es);burn(finalBurn);
    }
}
interface OrderedVm {
    function etch(address target,bytes calldata code) external;
    function prank(address sender) external;
}

contract CallbackOwner {
    TypeRegistry public registry;
    bytes32 public changeType;
    Ledger public core;
    Ledger public next;
    UpgradeProxy public proxy;
    AttackIndex public index;
    constructor() {
        registry=new TypeRegistry();
        changeType=registry.register(bytes32("change-type"),address(0),new bytes32[](0));
        Ledger initial=new Ledger(registry,bytes32("lock"));
        proxy=new UpgradeProxy(initial);core=Ledger(address(proxy));
        next=new Ledger(registry,bytes32("lock"));
        index=new AttackIndex(address(core),this);
        core.setIndexModule(address(index));
    }
    function run() external { core.create(bytes32("outer")); }
    function runWithMutation(uint256 mode) external {
        index.setMutation(mode);Ledger.Action[] memory a=new Ledger.Action[](2);
        a[0].kind=5;a[0].salt=bytes32("outer");a[1].kind=5;a[1].salt=bytes32("must-not-apply");
        core.execute(a,new bytes[](2),core.nonces(address(this)));
    }
    function mutateRegistry(uint256 mode) external {
        require(msg.sender==address(index),"callback only");
        if(mode==1)registry.activate(changeType,address(0));
        else registry.setBindingRefType(bytes32("purpose"),bytes32("role"),changeType);
    }
    function attempt(uint256 action) external returns(bool ok,bytes memory err) {
        require(msg.sender==address(index),"callback only");
        if(action==0)return address(core).call(abi.encodeCall(core.create,(bytes32("nested"))));
        if(action==1)return address(core).call(abi.encodeCall(core.setIndexModule,(address(0))));
        if(action==2)return address(proxy).call(abi.encodeCall(proxy.upgradeTo,(next)));
        if(action==3)return address(index).call(abi.encodeCall(index.bumpGeneration,()));
        return address(index).call(abi.encodeCall(index.declareOptional,(bytes32("evil"),uint64(1))));
    }
}
contract AttackIndex is IndexModule {
    CallbackOwner immutable owner;
    uint256 public prefixChecks;
    uint256 public mutation;
    constructor(address c,CallbackOwner o) IndexModule(c){owner=o;}
    function setMutation(uint256 mode)external{require(msg.sender==address(owner),"owner only");mutation=mode;}
    function onAdmission(uint64 p,Effect[] calldata es) public override {
        if(mutation!=0 && prefixChecks!=0)revert("basis check delayed");
        super.onAdmission(p,es);
        for(uint256 i;i<5;i++) {
            (bool ok,bytes memory err)=owner.attempt(i);
            require(!ok && bytes4(err)==ExecutionSlots.E_PUBLICATION_ACTIVE.selector,"mutable callback bypass");
            ++prefixChecks;
        }
        if(mutation==1 || mutation==2)owner.mutateRegistry(mutation);
        if(mutation==3)++generation; // bypass the base setter to exercise identity drift detection
    }
    function afterPublication(uint64 p,Effect[] calldata es) public view override returns(bytes4 acknowledgement) {
        acknowledgement=super.afterPublication(p,es);
        for(uint256 i;i<5;i++) {
            (bool returned,bytes memory result)=address(owner).staticcall(abi.encodeCall(owner.attempt,(i)));
            require(returned,"final descendant unexpectedly trapped");
            (bool ok,bytes memory err)=abi.decode(result,(bool,bytes));
            require(!ok && bytes4(err)==ExecutionSlots.E_PUBLICATION_ACTIVE.selector,"final callback bypass");
        }
    }
}

contract CoreOrderedAcceptanceTest is LabBase {
    event log_named_uint(string key,uint256 value);
    function test_runtime_and_initcode_fit_ordinary_deployment_limits() public view {
        require(address(ledger).code.length<=24_576,"Ledger EIP-170 overflow");
        (address helper,)=ledger.publicationSupportIdentity();
        require(helper.code.length<=24_576,"dispatch EIP-170 overflow");
        require(type(Ledger).creationCode.length+64<=49_152,"Ledger EIP-3860 overflow");
    }
    function test_duplicate_reuse_withdraw_and_binding_prefix_agreement() public {
        PrefixAgreementIndex checking=new PrefixAgreementIndex(address(ledger));
        index=checking;ledger.setIndexModule(address(index));
        bytes memory data=hex"0102";bytes32 record=rid(ITEM,data);
        Ledger.Action[] memory a=new Ledger.Action[](8);bytes[] memory b=new bytes[](8);
        a[0]=aPublish(ITEM,data);b[0]=data;a[1]=aPublish(ITEM,data);b[1]=data;
        a[2]=aReuse(ITEM,record);a[3]=aWithdraw(2);
        a[4]=aBind(HEAD,record,0,record,0);
        a[5]=aBind(HEAD,record,0,record,1);a[6]=aUnbind(HEAD,record,0,2);a[7]=aWithdraw(1);
        ledger.execute(a,b,0);
        (uint64 lifetime,uint64 live,,)=index.postingHead(Keys.byTypeList(ITEM));
        require(lifetime==3 && live==1 && index.postingAt(Keys.byTypeList(ITEM),2)==3,"occurrence accounting");
        (uint64 binds,uint64 backlinks,,)=index.postingHead(Keys.backlinkList(record));
        require(binds==2 && backlinks==0,"backlink accounting");
        bytes32 key=Keys.binding(pid(address(this)),Keys.position(HEAD,record,0));
        (uint64 history,,,)=index.postingHead(Keys.historyList(key));
        require(history==3 && index.lastProcessed()==8 && index.lastPublication()==1,"duplicate final maintenance");
    }

    function _equipment() private returns(bytes32 t,bytes memory loadout,EquipmentEligibility eligible) {
        // A rule using the old LabBase index would become PARTIAL and reject.
        index=new IndexModule(address(ledger));ledger.setIndexModule(address(index));
        eligible=new EquipmentEligibility();EquipmentRule rule=new EquipmentRule(eligible);
        bytes32 character=registry.register(keccak256("character"),address(0),new bytes32[](0));
        bytes32[] memory types=new bytes32[](8);types[0]=character;
        bytes32[8] memory ids;ids[0]=ledger.publish(character,abi.encode(uint256(1)));
        for(uint256 i=1;i<8;i++){types[i]=ITEM;ids[i]=ledger.publish(ITEM,abi.encode(i));}
        t=registry.register(keccak256("equipment"),address(rule),types);
        loadout=abi.encode(ids,uint256(1));
    }
    function test_eight_reference_quota_mutable_dependency_and_application_atomicity() public {
        (bytes32 t,bytes memory data,EquipmentEligibility eligible)=_equipment();
        EquipmentApplication app=new EquipmentApplication();
        bytes[] memory b=new bytes[](1);b[0]=data;
        uint256 beforeGas=gasleft();app.equip(ledger,one(aPublish(t,data)),b);
        emit log_named_uint("8-ref guarded app warm call gas",beforeGas-gasleft());
        require(app.operations()==1,"app did not commit");
        bytes32 id=rid(t,data);(,uint64 first,,)=ledger.record(id);
        Ledger.PublicationContext memory oldContext=ledger.publicationContext(9);
        uint64 beforeCount=admissions();
        // New first admission cannot be bypassed by a duplicate/reuse batch.
        Ledger.Action[] memory pair=two(aPublish(t,data),aReuse(t,id));bytes[] memory pairBodies=new bytes[](2);pairBodies[0]=data;
        (bool ok,)=address(app).call(abi.encodeCall(app.equip,(ledger,pair,pairBodies)));
        require(!ok && app.operations()==1 && admissions()==beforeCount,"quota/app rollback");
        // Wrong ordering cannot borrow a future withdrawal.
        (ok,)=address(app).call(abi.encodeCall(app.equip,(ledger,two(aReuse(t,id),aWithdraw(first)),new bytes[](2))));
        require(!ok && admissions()==beforeCount,"future withdrawal quota bypass");
        // Correct ordering releases live quota, not lifetime membership.
        app.equip(ledger,two(aWithdraw(first),aReuse(t,id)),new bytes[](2));
        (uint64 count,uint64 live,,)=index.postingHead(Keys.byTypeList(t));
        require(count==2 && live==1 && app.operations()==2,"live/lifetime confusion");
        eligible.set(false);
        beforeCount=admissions();
        (ok,)=address(app).call(abi.encodeCall(app.equip,(ledger,two(aWithdraw(beforeCount),aReuse(t,id)),new bytes[](2))));
        require(!ok && admissions()==beforeCount && app.operations()==2,"mutable dependency bypass/partial app");
        (,,uint32 occurrences,)=ledger.record(id);require(occurrences==1,"historical occurrence invalidated");
        require(keccak256(abi.encode(oldContext))==keccak256(abi.encode(ledger.publicationContext(9))),"history rewritten");
        eligible.set(true);app.equip(ledger,two(aWithdraw(beforeCount),aReuse(t,id)),new bytes[](2));
        require(app.operations()==3,"lock not restored after refusal");
    }

    function test_prefix_and_final_failure_restore_all_state() public {
        for(uint256 f;f<2;f++) {
            PhaseRefusingIndex refusing=new PhaseRefusingIndex(address(ledger),f==1);
            ledger.setIndexModule(address(refusing));
            bytes memory data=hex"1212";bytes[] memory b=new bytes[](2);b[1]=data;
            Ledger.Action[] memory a=two(aCreate(bytes32("rollback")),aPublish(ITEM,data));
            bytes32 key=keccak256(abi.encode(address(this),uint64(0),keccak256(abi.encode(a))));
            (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.execute,(a,b,uint64(0))));
            bytes memory inner=abi.encodeWithSelector(f==0?PhaseRefusingIndex.E_PREFIX.selector:PhaseRefusingIndex.E_FINAL.selector);
            require(!ok && keccak256(err)==keccak256(abi.encodeWithSelector(Ledger.E_INDEX.selector,inner)),"wrong phase refusal");
            require(ledger.extsload(bytes32(uint256(1)))==0 && ledger.nonces(address(this))==0 && ledger.publicationOf(key)==0,"counters/nonce/key leak");
            require(ledger.subjectCreatedAt(Keys.subject(pid(address(this)),bytes32("rollback")))==0 && ledger.body(rid(ITEM,data)).length==0,"logical leak");
            require(refusing.lastProcessed()==0 && refusing.postingWord(Keys.byTypeList(ITEM),0)==0 && ledger.publicationContext(1).principalId==0,"index/evidence leak");
            require(ledger.extsload(ExecutionSlots.PUBLICATION_ACTIVE)==0,"failed lock leak");
        }
        ledger.setIndexModule(address(index));ledger.create(bytes32("after-refusal"));require(admissions()==1,"next operation locked");
    }

    function test_callback_cannot_reenter_mutation_configuration_or_proxy_upgrade() public {
        CallbackOwner owner=new CallbackOwner();Ledger core=owner.core();
        bytes32 execution=core.executionSet();address implementation=owner.proxy().implementation();
        owner.run();
        (uint64 count,,,)=core.counts();
        require(count==1 && owner.index().prefixChecks()==5,"missing callback checks");
        require(core.executionSet()==execution && owner.proxy().implementation()==implementation && owner.index().generation()==0,"callback configuration changed");
        require(core.subjectCreatedAt(Keys.subject(core.principalOf(address(owner)),bytes32("nested")))==0,"nested publication committed");
        require(core.extsload(ExecutionSlots.PUBLICATION_ACTIVE)==0,"successful lock leak");
    }
    function test_registry_and_execution_drift_roll_back_before_next_rule() public {
        for(uint256 mode=1;mode<=3;mode++){
            CallbackOwner owner=new CallbackOwner();Ledger core=owner.core();
            bytes32 execution=core.executionSet();uint64 epoch=owner.registry().epoch();
            (bool ok,bytes memory err)=address(owner).call(abi.encodeCall(owner.runWithMutation,(mode)));
            require(!ok && bytes4(err)==Ledger.E_INTENT.selector,"callback basis drift committed or checked too late");
            (uint64 count,,,)=core.counts();
            require(count==0 && core.nonces(address(owner))==0 && owner.index().prefixChecks()==0,"basis drift leaked state");
            require(core.executionSet()==execution && owner.registry().epoch()==epoch && owner.index().generation()==0,"basis drift leaked configuration");
            require(owner.registry().bindingRefType(bytes32("purpose"),bytes32("role"))==0,"role mutation leaked");
            owner.run();
        }
    }
    function test_static_codecs_preserve_hashes_order_and_unknown_type_behavior() public {
        Ledger.ReadSetV2 memory rs;
        rs.principalIds=new bytes32[](2);rs.principalIds[0]=bytes32(uint256(11));rs.principalIds[1]=bytes32(uint256(22));
        rs.positions=new bytes32[](1);rs.positions[0]=bytes32(uint256(33));
        rs.expectedHeads=new bytes32[](2);rs.expectedHeads[0]=bytes32(uint256(44));rs.expectedHeads[1]=bytes32(uint256(55));
        bytes32 expected=keccak256(abi.encode(keccak256("efs.lab.read-set/2:ordered-first-binding"),rs));
        uint256 beforeGas=gasleft();require(ledger.readSetHash(rs)==expected,"read-set codec changed hash");
        emit log_named_uint("read-set 2x1 warm call gas",beforeGas-gasleft());
        bytes32 unknown=bytes32(uint256(123));Ledger.Action[] memory a=two(aPublish(QUOTE,q(1)),aPublish(unknown,q(2)));
        expected=keccak256(abi.encode(keccak256("efs.lab.acceptance-profile/2"),address(registry),registry.epoch()));
        expected=keccak256(abi.encode(expected,QUOTE,address(quoteRule),address(quoteRule).codehash,address(acceptor),address(acceptor).codehash,uint16(2)));
        expected=keccak256(abi.encode(expected,unknown,address(0),bytes32(0),address(0),bytes32(0),uint16(0)));
        beforeGas=gasleft();require(ledger.acceptanceProfileOf(a)==expected,"profile codec changed fields/order");
        emit log_named_uint("two-action profile warm call gas",beforeGas-gasleft());
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.publish,(unknown,q(2))));
        require(!ok && bytes4(err)==Ledger.E_UNKNOWN_TYPE.selector,"unknown Type admission semantics changed");
    }
    function test_legacy_fallback_index_cannot_skip_mandatory_final_phase() public {
        ledger.setIndexModule(address(new LegacyFallbackIndex()));
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.create,(bytes32("old-module"))));
        require(!ok && admissions()==0,"missing final ABI silently accepted");
        for(uint256 i;i<2;i++){
            ledger.setIndexModule(address(new MalformedFinalIndex(i==1)));
            (ok,)=address(ledger).call(abi.encodeCall(ledger.create,(bytes32("bad-result"))));
            require(!ok && admissions()==0,"wrong final magic/length accepted");
        }
    }
    function test_static_type_rule_cannot_mutate_dependency() public {
        EquipmentEligibility dependency=new EquipmentEligibility();
        bytes32 t=registry.register(keccak256("mutating-rule"),address(new MutatingRule(dependency)),new bytes32[](0));
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.publish,(t,hex"01")));
        require(!ok && bytes4(err)==Ledger.E_REJECTED.selector && dependency.eligible(),"Type rule mutated descendant");
        require(admissions()==0 && ledger.nonces(address(this))==0 && index.lastProcessed()==0,"static rule partial write");
    }
    function test_final_phase_is_static_and_rolls_back_prefix_writes() public {
        WritingFinalIndex writing=new WritingFinalIndex();ledger.setIndexModule(address(writing));
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.create,(bytes32("static-final"))));
        require(!ok && bytes4(err)==Ledger.E_INDEX.selector && admissions()==0,"final phase used CALL");
        require(writing.prefixWrites()==0 && writing.finalWrites()==0 && ledger.nonces(address(this))==0,"final refusal leaked prefix");
    }
    function test_callback_returndata_is_bounded_before_copy() public {
        OversizedCallbackIndex oversized=new OversizedCallbackIndex();ledger.setIndexModule(address(oversized));
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.create,(bytes32("oversized"))));
        require(!ok && keccak256(err)==keccak256(abi.encodeWithSignature("E_INDEX_RETURNDATA(uint256)",uint256(4097))),"unbounded callback returndata accepted");
        require(admissions()==0 && oversized.touched()==0 && ledger.nonces(address(this))==0,"oversized callback leaked state");
    }
    function test_prefix_and_final_spend_one_joint_allowance() public {
        for(uint256 mode;mode<2;mode++){
            BudgetBurningIndex burner=new BudgetBurningIndex(address(ledger),mode==0?220_000:200_000,mode==0?0:150_000);
            ledger.setIndexModule(address(burner));
            uint256 n=mode==0?3:2;Ledger.Action[] memory a=new Ledger.Action[](n);
            for(uint256 i;i<n;i++)a[i]=aCreate(bytes32(i+1));
            (bool ok,bytes memory err)=address(ledger).call{gas:15_000_000}(abi.encodeCall(ledger.execute,(a,new bytes[](n),uint64(0))));
            require(!ok && bytes4(err)==Ledger.E_INDEX.selector,"callback allowance was renewed");
            require(admissions()==0 && burner.lastProcessed()==0 && ledger.nonces(address(this))==0,"budget refusal leaked prefix");
        }
        ledger.setIndexModule(address(index));ledger.create(bytes32("after-budget"));
    }
    function test_fixed_dispatch_identity_mismatch_fails_closed() public {
        (address helper,bytes32 expectedHash)=ledger.publicationSupportIdentity();bytes memory original=helper.code;
        require(helper!=address(0) && helper.codehash==expectedHash,"dependency not recoverable");
        bytes32 execution=ledger.executionSet();
        OrderedVm(address(vm)).etch(helper,hex"00");
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.create,(bytes32("mismatch"))));
        require(!ok && bytes4(err)==Ledger.E_INDEX.selector && admissions()==0 && ledger.nonces(address(this))==0,"dependency mismatch accepted");
        require(ledger.executionSet()==execution,"pinned execution silently adopted new dependency");
        OrderedVm(address(vm)).etch(helper,original);ledger.create(bytes32("restored"));
    }
    function test_noncontiguous_required_index_refuses_without_laundering_coverage() public {
        ledger.create(bytes32("one"));ledger.setIndexModule(address(0));ledger.create(bytes32("gap"));
        ledger.setIndexModule(address(index));
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.create,(bytes32("three"))));
        require(!ok && bytes4(err)==Ledger.E_INDEX.selector && admissions()==2 && index.lastProcessed()==1,"gap advanced required frontier");
        (uint8 status,uint64 from,uint64 through)=index.coverage(index.FAMILY_SCOPE(),0);
        require(status==1 && from==1 && through==1,"gap laundered COMPLETE");
        IIndexModule.Effect[] memory es=new IIndexModule.Effect[](2);es[0].admission=2;es[0].kind=5;es[1].admission=2;es[1].kind=5;
        OrderedVm(address(vm)).prank(address(ledger));
        (ok,err)=address(index).call(abi.encodeCall(index.onAdmission,(uint64(2),es)));
        require(!ok && bytes4(err)==IndexModule.E_SEGMENT.selector && index.lastProcessed()==1,"malformed segment accepted");
        (ok,err)=address(index).staticcall(abi.encodeCall(index.afterPublication,(uint64(2),es)));
        require(!ok && bytes4(err)==IndexModule.E_LEDGER.selector,"final callback not Ledger-only");
    }
    function test_earlier_same_batch_reference_succeeds_future_reference_rolls_back() public {
        bytes memory item=abi.encode(uint256(7));bytes32 id=rid(ITEM,item);
        bytes memory pair=abi.encode(id,id,uint256(1));bytes[] memory bodies=new bytes[](2);bodies[0]=pair;bodies[1]=item;
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.execute,(two(aPublish(PAIR,pair),aPublish(ITEM,item)),bodies,uint64(0))));
        require(!ok && bytes4(err)==Ledger.E_REF_MISSING.selector && admissions()==0,"future reference accepted");
        bodies[0]=item;bodies[1]=pair;ledger.execute(two(aPublish(ITEM,item),aPublish(PAIR,pair)),bodies,0);
        (uint64 count,,,)=index.postingHead(Keys.byTypeList(PAIR));require(count==1 && admissions()==2,"earlier reference failed");
    }
    function test_low_work_55_leaf_publication_uses_actual_gas_not_unused_allowance() public {
        Ledger.Action[] memory a=new Ledger.Action[](55);bytes[] memory b=new bytes[](55);
        for(uint256 i;i<55;i++)a[i]=aCreate(bytes32(i+1));
        uint256 beforeGas=gasleft();
        (bool ok,)=address(ledger).call{gas:15_000_000}(abi.encodeCall(ledger.execute,(a,b,uint64(0))));
        emit log_named_uint("55 CREATE warm call gas",beforeGas-gasleft());
        require(ok && admissions()==55,"unused allowance became outer reserve");
    }
}
