// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesCarrierIndexTest} from "./FilesCarrierProfile.t.sol";
import {LiveFilesLayout,LiveFilesDescriptorRule,LiveFilesRootRule,LiveFilesChildRule,LiveFilesIndex} from "./LiveFilesProfile.sol";
import {FilesDirectoryIndex} from "./FilesDirectoryProfile.sol";
import {Keys} from "../src/Keys.sol";
import {FilesFinalValidator} from "./FilesFinalValidator.sol";
import {LiveFilesAdapter,LiveQuoteProvider,LiveQuoteRule} from "./LiveFilesAdapter.sol";
import {LiveFilesPageReader,LiveFilesMountedReader,LiveFilesPaid} from "./LiveFilesReader.sol";
import {FilesPageReader} from "./FilesPageReader.sol";
import {FilesLiveLens} from "./FilesLiveIndex.sol";
import {Ledger} from "../src/Ledger.sol";
interface LiveVm {function etch(address,bytes calldata) external;function chainId(uint256) external;}

contract LiveFitProvider {
    function quote(bytes32) external pure returns(uint128,bool){return (42,true);}
}
contract LiveProxyControl {
    address public implementation;
    constructor(address target){implementation=target;}
    function setImplementation(address target) external {implementation=target;}
    fallback() external {
        address target=implementation;
        assembly("memory-safe"){
            calldatacopy(0,0,calldatasize())
            let ok:=delegatecall(gas(),target,0,calldatasize(),0,0)
            returndatacopy(0,0,returndatasize())
            if iszero(ok){revert(0,returndatasize())}
            return(0,returndatasize())
        }
    }
}
contract LiveFilesTest is FilesCarrierIndexTest {
    LiveVm private constant probe=LiveVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    bytes32[3] lt; bytes32[3] lh;
    LiveQuoteProvider provider;LiveFilesAdapter liveAdapter;bytes32 quoteType;
    function setUp() public override {
        super.setUp();provider=new LiveQuoteProvider();
        quoteType=registry.register(keccak256("lab/type/live-quote-u128-bool-max100/1"),address(new LiveQuoteRule()),new bytes32[](0));
        liveAdapter=new LiveFilesAdapter(ledger,quoteType,keccak256(type(LiveQuoteProvider).runtimeCode));
        address rule=address(liveAdapter.descriptorRule());lh[0]=rule.codehash;
        lt[0]=registry.register(LiveFilesLayout.DESCRIPTOR,rule,new bytes32[](0));
        bytes32[] memory refs=new bytes32[](1);refs[0]=lt[0];
        rule=address(new LiveFilesRootRule());lh[1]=rule.codehash;lt[1]=registry.register(LiveFilesLayout.ROOT,rule,refs);
        rule=address(new LiveFilesChildRule([rt,ct,ts[2],ts[3],lt[1]]));lh[2]=rule.codehash;
        refs=new bytes32[](2);refs[1]=lt[0];lt[2]=registry.register(LiveFilesLayout.CHILD,rule,refs);
        bytes32[8] memory old=[rt,ct,live.expectedRootRuleHash(),live.expectedChildRuleHash(),nt,live.expectedNameRuleHash(),dt,FilesDirectoryIndex(address(live)).expectedDirectoryRuleHash()];
        FilesFinalValidator helper=new FilesFinalValidator(address(ledger),old[4],old[5],old[6],old[7]);
        live=new LiveFilesIndex(address(ledger),old,ts,hs,lt,lh,helper,address(helper).codehash);index=live;ledger.setIndexModule(address(index));
    }
    function recipe() internal view returns(bytes memory){
        return abi.encode(LiveFilesLayout.Recipe(1,block.chainid,LiveFilesLayout.VENUE,address(provider),address(provider).codehash,
            LiveFilesLayout.SELECTOR,bytes32(uint256(7)),quoteType,1,50000,64,address(liveAdapter)));
    }
    function rejected(bytes32 t,bytes memory b) internal {
        uint64 before_=admissions();(bool ok,)=address(ledger).call(abi.encodeCall(ledger.publish,(t,b)));
        require(!ok,"invalid live fact admitted");require(admissions()==before_,"failed live admission leaked");
    }
    function test_live_descriptor_admits_exact_recipe() public {
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.publish,(lt[0],recipe())));
        require(ok,"exact finite live recipe rejected");
    }
    function test_live_descriptor_rejects_unselected_proxy_runtime() public {
        LiveProxyControl proxy=new LiveProxyControl(address(new LiveFitProvider()));
        (bool ok,bytes memory value)=address(proxy).staticcall(abi.encodeWithSelector(LiveFilesLayout.SELECTOR,bytes32(0)));
        require(ok&&keccak256(value)==keccak256(abi.encode(uint128(42),true)),"proxy negative control is not callable");
        LiveFilesLayout.Recipe memory r=abi.decode(recipe(),(LiveFilesLayout.Recipe));
        r.provider=address(proxy);r.providerHash=address(proxy).codehash;
        rejected(lt[0],abi.encode(r));
    }
    function test_live_provider_parameter_is_part_of_exact_rule_identity() public {
        LiveFilesDescriptorRule a=new LiveFilesDescriptorRule(address(liveAdapter),quoteType,address(provider).codehash);
        LiveFilesDescriptorRule b=new LiveFilesDescriptorRule(address(liveAdapter),quoteType,bytes32(uint256(123)));
        require(address(a).codehash!=address(b).codehash,"provider runtime selection absent from Type identity");
    }
    function test_live_checked_composition_and_directed_parent_matrix() public {
        bytes32 d=ledger.publish(lt[0],recipe());bytes32 f=ledger.create(bytes32(uint256(51)));bytes32 other=ledger.create(bytes32(uint256(52)));
        bytes32 root=ledger.publish(lt[1],abi.encode(d,f));
        bytes32 stored=ledger.publish(ts[0],abi.encode(sha256("")));
        bytes32 desc=ledger.publish(ts[1],abi.encode(stored,uint256(1),uint256(0),uint256(1),uint256(0),sha256(""),uint256(0),uint256(0),bytes32(0),uint256(0),sha256("")));
        bytes32 inlineRoot=ledger.publish(rt,abi.encode(f));bytes32 inlineChild=ledger.publish(ct,abi.encode(inlineRoot,f));
        bytes32 carrierRoot=ledger.publish(ts[2],abi.encode(desc,f));bytes32 carrierChild=ledger.publish(ts[3],abi.encode(carrierRoot,desc,f));
        bytes32 child=ledger.publish(lt[2],abi.encode(root,d,f));
        bytes32[6] memory p=[inlineRoot,inlineChild,carrierRoot,carrierChild,root,child];
        for(uint256 i;i<6;i++){ledger.publish(lt[2],abi.encode(p[i],d,f));rejected(lt[2],abi.encode(p[i],d,other));}
        rejected(ct,abi.encode(root,f));rejected(ts[3],abi.encode(root,desc,f));
        rejected(lt[2],abi.encode(ledger.publish(BINARY,abi.encode(f)),d,f));
        rejected(lt[1],abi.encode(bytes32(uint256(88)),f));rejected(lt[1],abi.encode(stored,f));
        rejected(lt[1],abi.encode(d,bytes32(uint256(99))));rejected(lt[2],abi.encode(root,d,f,uint256(1)));
    }
    function test_live_descriptor_exact_widths_context_and_cap() public {
        bytes memory d=recipe();ledger.publish(lt[0],d);
        rejected(lt[0],bytes.concat(d,hex"00"));
        for(uint256 word;word<12;word++){
            if(word==6)continue; // every bytes32 key is supported
            bytes memory bad=recipe();assembly("memory-safe"){mstore(add(add(bad,32),mul(word,32)),0)}
            rejected(lt[0],bad);
        }
        d=recipe();d[127]=bytes1(uint8(1));rejected(lt[0],d);
        d=recipe();d[191]=bytes1(uint8(1));rejected(lt[0],d);
    }
    function test_live_index_generic_refs_once_on_reuse() public {
        bytes32[8] memory old=[rt,ct,live.expectedRootRuleHash(),live.expectedChildRuleHash(),nt,live.expectedNameRuleHash(),dt,FilesDirectoryIndex(address(live)).expectedDirectoryRuleHash()];
        FilesFinalValidator helper=new FilesFinalValidator(address(ledger),old[4],old[5],old[6],old[7]);
        live=new LiveFilesIndex(address(ledger),old,ts,hs,lt,lh,helper,address(helper).codehash);index=live;ledger.setIndexModule(address(index));
        bytes32 d=ledger.publish(lt[0],recipe());bytes32 f=ledger.create(bytes32(uint256(81)));bytes32 root=ledger.publish(lt[1],abi.encode(d,f));
        bytes memory body=abi.encode(root,d,f);ledger.publish(lt[2],body);ledger.publish(lt[2],body);
        (uint64 count,,,)=index.postingHead(Keys.referenceList(lt[2],0,root));require(count==1,"live parent posting duplicated");
        (count,,,)=index.postingHead(Keys.referenceList(lt[2],1,d));require(count==1,"live descriptor posting duplicated");
    }
    function test_live_index_refuses_missing_external_helper() public {
        bytes32[8] memory old=[rt,ct,live.expectedRootRuleHash(),live.expectedChildRuleHash(),nt,live.expectedNameRuleHash(),dt,FilesDirectoryIndex(address(live)).expectedDirectoryRuleHash()];
        bytes memory init=bytes.concat(type(LiveFilesIndex).creationCode,abi.encode(address(ledger),old,ts,hs,lt,lh,address(0),bytes32(0)));
        address deployed;assembly("memory-safe"){deployed:=create(0,add(init,32),mload(init))}
        require(deployed==address(0),"index accepted missing supplied final validator");
    }
    function test_live_observation_zero_false_not_failure_and_shape_is_not_admission() public {
        bytes32 output=quoteType;
        LiveFilesAdapter adapter=new LiveFilesAdapter(ledger,output,keccak256(type(LiveQuoteProvider).runtimeCode));LiveQuoteProvider source=new LiveQuoteProvider();
        bytes32 dtype=registry.register(LiveFilesLayout.DESCRIPTOR,address(adapter.descriptorRule()),new bytes32[](0));
        bytes memory body=abi.encode(LiveFilesLayout.Recipe(1,block.chainid,LiveFilesLayout.VENUE,address(source),address(source).codehash,
            LiveFilesLayout.SELECTOR,bytes32(uint256(7)),output,1,50000,64,address(adapter)));
        bytes32 d=ledger.publish(dtype,body);uint64 before_=admissions();
        source.update(0,false,0,address(adapter));LiveFilesAdapter.Observation memory o=adapter.observe(d,before_);
        require(o.status==1&&o.value==0&&!o.flag&&o.raw.length==64,"zero/false confused with failure");
        source.update(150,true,0,address(adapter));o=adapter.observe(d,before_);
        require(o.status==1&&o.value==150,"shape-valid output denied by admission predicate");
        rejected(output,o.raw);require(admissions()==before_,"provider update wrote EFS");
        source.update(42,true,0,address(adapter));o=adapter.observe(d,before_);ledger.publish(output,o.raw);
        for(uint8 mode=1;mode<=6;mode++){
            source.update(42,true,mode,address(adapter));o=adapter.observe(d,admissions());
            require(o.status!=1&&o.raw.length==0,"failed/malformed provider reclassified as valid bytes");
        }
    }
    function test_live_page_recognizes_exact_revision_without_reading_provider() public {
        bytes32[8] memory old=[rt,ct,live.expectedRootRuleHash(),live.expectedChildRuleHash(),nt,live.expectedNameRuleHash(),dt,FilesDirectoryIndex(address(live)).expectedDirectoryRuleHash()];
        FilesFinalValidator helper=new FilesFinalValidator(address(ledger),old[4],old[5],old[6],old[7]);
        LiveFilesIndex next=new LiveFilesIndex(address(ledger),old,ts,hs,lt,lh,helper,address(helper).codehash);
        live=next;index=next;ledger.setIndexModule(address(next));
        bytes32 folder=_directory(90);bytes32 f=ledger.create(bytes32(uint256(91)));
        bytes32 d=ledger.publish(lt[0],recipe());bytes32 root=ledger.publish(lt[1],abi.encode(d,f));
        ledger.bind(HEAD,f,0,root,0);ledger.publish(nt,bytes("live"));ledger.bind(FOLDER,folder,name("live"),f,0);
        LiveFilesPageReader page=new LiveFilesPageReader(ledger,new FilesLiveLens(ledger,next),next);
        bytes32[] memory principals=new bytes32[](1);principals[0]=pid(address(this));FilesPageReader.Query memory query;
        FilesPageReader.Page memory p=page.readPage(folder,principals,query,FilesPageReader.Basis(admissions(),next.generation(),registry.epoch(),ledger.executionSet()),"",8);
        require(p.rows.length==1&&p.rows[0].header.qualification==1&&p.rows[0].header.descriptor==d,"live revision dispatched as unsupported/stored");
    }
    function test_live_mounted_consumer_same_transaction_update_and_failure_masking() public {
        bytes32 folder=_directory(301);bytes32 f=ledger.create(bytes32(uint256(302)));
        bytes32 d=ledger.publish(lt[0],recipe());bytes32 root=ledger.publish(lt[1],abi.encode(d,f));
        ledger.bind(HEAD,f,0,root,0);ledger.publish(nt,bytes("value"));ledger.bind(FOLDER,folder,name("value"),f,0);
        bytes32 lower=ledger.create(bytes32(uint256(303)));alice.bind(FOLDER,folder,name("value"),lower,0);
        LiveFilesPageReader page=new LiveFilesPageReader(ledger,new FilesLiveLens(ledger,index),LiveFilesIndex(address(index)));
        LiveFilesMountedReader reader=new LiveFilesMountedReader(page,liveAdapter);
        bytes32[] memory principals=new bytes32[](2);principals[0]=pid(address(this));principals[1]=pid(address(alice));
        FilesPageReader.Basis memory basis=FilesPageReader.Basis(admissions(),index.generation(),registry.epoch(),ledger.executionSet());
        provider.update(0,false,0,address(liveAdapter));
        LiveFilesMountedReader.Result memory r=reader.read(folder,principals,name("value"),basis,"",8);
        require(r.status==1&&r.live.status==1&&r.live.value==0&&!r.live.flag&&r.raw.length==64,"mounted zero/false failed");
        uint64 before_=admissions();new LiveFilesPaid().updateAndRead(provider,75,true,reader,folder,principals,name("value"),basis);
        r=reader.read(folder,principals,name("value"),basis,"",8);
        require(r.live.value==75&&admissions()==before_&&r.selectionOrigin==before_,"same-tx provider change wrote EFS or read stale value");
        provider.update(75,true,1,address(liveAdapter));r=reader.read(folder,principals,name("value"),basis,"",8);
        require(r.file==f&&r.revision==root&&r.status==5&&r.live.status==5&&r.raw.length==0,"provider failure revealed lower-priority File");
    }
    function test_mounted_reader_distinguishes_page_miss_from_proven_absence() public {
        bytes32 folder=_directory(601);
        bytes32 first=ledger.create(bytes32(uint256(602)));
        bytes32 second=ledger.create(bytes32(uint256(603)));
        bytes32 firstRevision=ledger.publish(rt,abi.encode(first));
        bytes32 secondRevision=ledger.publish(rt,abi.encode(second));
        ledger.bind(HEAD,first,0,firstRevision,0);
        ledger.bind(HEAD,second,0,secondRevision,0);
        ledger.publish(nt,bytes("a"));ledger.bind(FOLDER,folder,name("a"),first,0);
        ledger.publish(nt,bytes("b"));ledger.bind(FOLDER,folder,name("b"),second,0);
        LiveFilesPageReader page=new LiveFilesPageReader(ledger,new FilesLiveLens(ledger,index),LiveFilesIndex(address(index)));
        LiveFilesMountedReader reader=new LiveFilesMountedReader(page,liveAdapter);
        bytes32[] memory principals=new bytes32[](1);principals[0]=pid(address(this));
        FilesPageReader.Basis memory pinned=FilesPageReader.Basis(admissions(),index.generation(),registry.epoch(),ledger.executionSet());
        LiveFilesMountedReader.Result memory firstPage=reader.read(folder,principals,name("b"),pinned,"",1);
        require(firstPage.status==reader.NOT_ON_THIS_PAGE()&&firstPage.continuation.length!=0
            &&!firstPage.descriptorsCompleteFromOrigin,"partial page lied about absence");
        LiveFilesMountedReader.Result memory secondPage=reader.read(folder,principals,name("b"),pinned,firstPage.continuation,1);
        require(secondPage.status==reader.STORED_BYTES()&&secondPage.file==second,"continuation lost selected file");
        LiveFilesMountedReader.Result memory absent=reader.read(folder,principals,name("missing"),pinned,"",8);
        require(absent.status==reader.ABSENT_PROVEN()&&absent.descriptorsCompleteFromOrigin,"full origin scan failed to prove absence");
        LiveFilesMountedReader.Result memory suffix=reader.read(folder,principals,name("missing"),pinned,firstPage.continuation,8);
        require(suffix.status==reader.NOT_ON_THIS_PAGE()&&!suffix.descriptorsCompleteFromOrigin,"suffix scan forged full-query absence");
    }
    function test_live_child_parent_configuration_changes_exact_rule_identity() public {
        LiveFilesChildRule a=new LiveFilesChildRule([rt,ct,ts[2],ts[3],lt[1]]);
        LiveFilesChildRule b=new LiveFilesChildRule([rt,ct,ts[2],ts[3],bytes32(uint256(123))]);
        require(address(a).codehash!=address(b).codehash,"parent configuration absent from mandatory rule identity");
    }
    function nextIndex(FilesFinalValidator helper,bytes32 helperHash) internal returns(LiveFilesIndex){
        bytes32[8] memory old=[rt,ct,live.expectedRootRuleHash(),live.expectedChildRuleHash(),nt,live.expectedNameRuleHash(),dt,FilesDirectoryIndex(address(live)).expectedDirectoryRuleHash()];
        return new LiveFilesIndex(address(ledger),old,ts,hs,lt,lh,helper,helperHash);
    }
    function test_live_helper_wrong_hash_or_ledger_refused_and_code_drift_rolls_back() public {
        FilesFinalValidator helper=LiveFilesIndex(address(index)).finalValidator();
        try this.badHelper(helper,bytes32(uint256(1))){revert("wrong helper hash accepted");}catch{}
        Ledger other=new Ledger(registry,REALM);
        FilesFinalValidator wrong=new FilesFinalValidator(address(other),nt,helper.nameHash(),dt,helper.directoryHash());
        try this.badHelper(wrong,address(wrong).codehash){revert("wrong bound Ledger accepted");}catch{}
        bytes32 folder=_directory(401);bytes32 f=ledger.create(bytes32(uint256(402)));uint64 before_=admissions();
        probe.etch(address(helper),hex"00");
        Ledger.Action[] memory a=two(aBind(FOLDER,folder,name("late"),f,0),aPublish(nt,bytes("late")));bytes[] memory b=new bytes[](2);b[1]=bytes("late");
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.execute,(a,b,ledger.nonces(address(this)))));
        bytes32 scope=Keys.scopeList(Keys.scope(pid(address(this)),FOLDER,folder));
        require(!ok&&admissions()==before_&&live.liveCount(scope)==0&&live.lastMutation(scope)==0,"failed helper leaked publication/companion");
    }
    function badHelper(FilesFinalValidator h,bytes32 hash_) external {nextIndex(h,hash_);}
    function test_live_provider_code_drift_and_caller_context() public {
        bytes32 d=ledger.publish(lt[0],recipe());uint64 through=admissions();
        provider.update(42,true,0,address(liveAdapter));
        (bool direct,)=address(provider).staticcall(abi.encodeCall(provider.quote,(bytes32(uint256(7)))));require(!direct,"caller-sensitive getter allowed wrong caller");
        require(liveAdapter.observe(d,through).status==1,"declared adapter caller failed");
        probe.etch(address(provider),hex"00");require(liveAdapter.observe(d,through).status==4,"provider code drift accepted");
    }
    function test_live_observation_unsupported_chain_is_not_empty_success() public {
        bytes32 d=ledger.publish(lt[0],recipe());probe.chainId(block.chainid+1);
        require(liveAdapter.observe(d,admissions()).status==2,"unsupported chain not typed");
    }
    function test_live_replay_preserves_facts_and_late_name_cannot_repair_history() public {
        bytes32 folder=_directory(411);bytes32 f=ledger.create(bytes32(uint256(412)));
        bytes32 d=ledger.publish(lt[0],recipe());ledger.publish(lt[1],abi.encode(d,f));
        FilesFinalValidator h=LiveFilesIndex(address(index)).finalValidator();
        FilesFinalValidator h2=new FilesFinalValidator(address(ledger),nt,h.nameHash(),dt,h.directoryHash());
        LiveFilesIndex replay=nextIndex(h2,address(h2).codehash);(,,,uint64 publications)=ledger.counts();
        provider.update(42,true,1,address(liveAdapter)); // no provider invocation in replay
        for(uint64 i;i<publications;i++)replay.replayNextPublication();
        require(replay.lastProcessed()==admissions()&&replay.manifestHash()==index.manifestHash()&&address(replay.scopeState())!=address(live.scopeState()),"replay semantics/config changed");
        ledger.setIndexModule(address(0));ledger.bind(FOLDER,folder,name("too-late"),f,0);ledger.publish(nt,bytes("too-late"));
        uint64 before_=replay.lastProcessed();(bool ok,)=address(replay).call(abi.encodeCall(replay.replayNextPublication,()));
        bytes32 scope=Keys.scopeList(Keys.scope(pid(address(this)),FOLDER,folder));
        require(!ok&&replay.lastProcessed()==before_&&replay.lastMutation(scope)==0&&replay.liveCount(scope)==0,"historical invalid final check repaired/leaked");
    }
    function test_live_future_descriptor_and_lookalike_rejected_and_retention_survives_withdrawal() public {
        bytes32 f=ledger.create(bytes32(uint256(421)));bytes memory body=recipe();bytes32 d=rid(lt[0],body);
        Ledger.Action[] memory a=two(aPublish(lt[1],abi.encode(d,f)),aPublish(lt[0],body));bytes[] memory b=new bytes[](2);b[0]=abi.encode(d,f);b[1]=body;
        uint64 before_=admissions();(bool ok,)=address(ledger).call(abi.encodeCall(ledger.execute,(a,b,ledger.nonces(address(this)))));
        require(!ok&&admissions()==before_,"future checked ref admitted");
        bytes32 fake=registry.register(LiveFilesLayout.DESCRIPTOR,address(0),new bytes32[](0));
        rejected(lt[1],abi.encode(ledger.publish(fake,body),f));
        d=ledger.publish(lt[0],body);(,uint64 first,,)=ledger.record(d);ledger.execute(one(aWithdraw(first)),new bytes[](1),ledger.nonces(address(this)));
        ledger.publish(lt[1],abi.encode(d,f));require(liveAdapter.observe(d,admissions()).status==1,"descriptor withdrawal erased retained recipe");
    }
    function test_live_helper_max_name_and_multi_bind_preserve_final_obligations() public {
        bytes memory longName=new bytes(255);for(uint256 i;i<255;i++)longName[i]=bytes1("a");
        bytes32 folder=_directory(431);bytes32 f=ledger.create(bytes32(uint256(432)));
        Ledger.Action[] memory a=new Ledger.Action[](4);bytes[] memory b=new bytes[](4);
        a[0]=aBind(FOLDER,folder,keccak256(longName),f,0);a[1]=aBind(FOLDER,folder,name("b"),f,0);
        a[2]=aPublish(nt,longName);b[2]=longName;a[3]=aPublish(nt,bytes("b"));b[3]=bytes("b");ledger.execute(a,b,ledger.nonces(address(this)));
        require(live.liveCount(Keys.scopeList(Keys.scope(pid(address(this)),FOLDER,folder)))==2,"255-byte Name or final multi-bind lost");
        ledger.publish(ts[0],bytes.concat(abi.encode(sha256(new bytes(8160))),new bytes(8160)));
    }
    function test_live_paid_duplicate_control_updates_provider_and_retains_output() public {
        LiveFilesPaid paid=new LiveFilesPaid();uint64 before_=admissions();
        (bool ok,)=address(paid).call(abi.encodeWithSignature("updateAndStore(address,uint128,bool,address,address,bytes32)",
            address(provider),uint128(90),false,address(liveAdapter),address(ledger),quoteType));
        require(ok&&admissions()==before_+1&&provider.value()==90,"duplicate stored publication control missing");
    }
}
