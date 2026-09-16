// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {LensReader} from "../src/LensReader.sol";
import {IAcceptor,IIndexReadiness} from "../src/Interfaces.sol";
import {FilesLayout,FilesRootRule,FilesChildRule} from "./FilesJoinedProfile.sol";
import {FilesNameLayout,FilesNameRule} from "./FilesNamesProfile.sol";
import {FilesDirectoryRule} from "./FilesDirectoryProfile.sol";
import {FilesBytesRule,FilesContentRule,FilesCarrierRootRule,FilesCarrierChildRule,FilesConceptRule} from "./FilesCarrierProfile.sol";
import {LiveFilesLayout,LiveFilesRootRule,LiveFilesChildRule,LiveFilesIndex} from "./LiveFilesProfile.sol";
import {LiveFilesAdapter,LiveQuoteProvider,LiveQuoteRule} from "./LiveFilesAdapter.sol";
import {FilesFinalValidator} from "./FilesFinalValidator.sol";
import {TagStanceIndex,TagStanceValidator} from "./TagStanceProfile.sol";

/// A later ordinary Type rule consumes the qualified prefix; no test callback
/// bypasses the actual publication path.
contract TagPrefixRule is IAcceptor {
    function accept(bytes32,bytes calldata data,bytes32[] calldata) external view returns(bool){
        (bytes32 key,uint64 ordinal)=abi.decode(data,(bytes32,uint64));
        return IndexModule(Ledger(msg.sender).indexModule()).postingAt(key,0)==ordinal;
    }
}
interface TagVm {function store(address,bytes32,bytes32) external;function etch(address,bytes calldata) external;}

contract TagStanceProfileTest is LabBase {
    bytes32 constant PURPOSE=keccak256("efs.lab/tag-stance/1");
    bytes32 constant FAMILY=keccak256("efs.lab/tag-role-inventory/1");
    bytes32[8] legacy;bytes32[5] ts;bytes32[5] hs;bytes32[3] lt;bytes32[3] lh;
    bytes32 tokenType;bytes tokenDescriptor;bytes32[3] tokens;
    bytes32 conceptC;bytes32 conceptC2;bytes32 fileF;bytes32 fileG;bytes32 orphanH;bytes32 directoryD;
    bytes32 revision1;bytes32 revision2;bytes32 prefixType;
    LiveFilesIndex files;FilesFinalValidator finalHelper;
    TagStanceValidator stanceHelper;
    LiveFilesAdapter adapter;LiveQuoteProvider provider;bytes32 quote;
    TagVm constant fault=TagVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function setUp() public override {
        super.setUp();
        address rule=address(new FilesRootRule());legacy[2]=rule.codehash;legacy[0]=registry.register(FilesLayout.ROOT_SHAPE,rule,new bytes32[](0));
        rule=address(new FilesChildRule(legacy[0]));legacy[3]=rule.codehash;legacy[1]=registry.register(FilesLayout.CHILD_SHAPE,rule,new bytes32[](1));
        rule=address(new FilesNameRule());legacy[5]=rule.codehash;legacy[4]=registry.register(FilesNameLayout.SHAPE,rule,new bytes32[](0));
        rule=address(new FilesDirectoryRule());legacy[7]=rule.codehash;legacy[6]=registry.register(keccak256("lab/type/files-directory/1"),rule,new bytes32[](0));
        rule=address(new FilesBytesRule());hs[0]=rule.codehash;ts[0]=registry.register(keccak256("lab/type/files-bytes/1"),rule,new bytes32[](0));
        bytes32[] memory refs=new bytes32[](1);refs[0]=ts[0];rule=address(new FilesContentRule(ts[0]));hs[1]=rule.codehash;
        ts[1]=registry.register(keccak256("lab/type/files-content/1"),rule,refs);
        refs[0]=ts[1];rule=address(new FilesCarrierRootRule());hs[2]=rule.codehash;ts[2]=registry.register(keccak256("lab/type/files-carrier-root/1"),rule,refs);
        refs=new bytes32[](2);refs[1]=ts[1];rule=address(new FilesCarrierChildRule(legacy[0],legacy[1],ts[2]));hs[3]=rule.codehash;
        ts[3]=registry.register(keccak256("lab/type/files-carrier-child/1"),rule,refs);
        rule=address(new FilesConceptRule());hs[4]=rule.codehash;ts[4]=registry.register(keccak256("lab/type/files-concept/1"),rule,new bytes32[](0));
        quote=registry.register(keccak256("lab/type/live-quote-u128-bool-max100/1"),address(new LiveQuoteRule()),new bytes32[](0));
        adapter=new LiveFilesAdapter(ledger,quote,keccak256(type(LiveQuoteProvider).runtimeCode));provider=new LiveQuoteProvider();
        rule=address(adapter.descriptorRule());lh[0]=rule.codehash;lt[0]=registry.register(LiveFilesLayout.DESCRIPTOR,rule,new bytes32[](0));
        refs=new bytes32[](1);refs[0]=lt[0];rule=address(new LiveFilesRootRule());lh[1]=rule.codehash;lt[1]=registry.register(LiveFilesLayout.ROOT,rule,refs);
        refs=new bytes32[](2);refs[1]=lt[0];rule=address(new LiveFilesChildRule([legacy[0],legacy[1],ts[2],ts[3],lt[1]]));lh[2]=rule.codehash;lt[2]=registry.register(LiveFilesLayout.CHILD,rule,refs);
        // Existing reviewed described-Type grammar: one exact 32-byte uint256.
        // Its broad structural domain deliberately admits4; the stance profile
        // must select exactly1/2/3 rather than trusting a matching Type alone.
        bytes memory label=bytes("TagStanceToken/1:1=ASSERT;2=DENY;3=SILENT");
        tokenDescriptor=abi.encodePacked(hex"01010001",eoaA,PURPOSE,bytes32(0),uint16(label.length),label,
            bytes32(uint256(1)),keccak256("stance-word"),uint8(3),uint8(0),uint16(32),uint256(0),type(uint256).max,bytes32(0));
        tokenType=registry.describedTypeId(tokenDescriptor);
        (uint8 v,bytes32 r,bytes32 s)=vm.sign(PK_A,registry.declarationDigest(tokenType));
        registry.registerDescribed(tokenDescriptor,abi.encodePacked(r,s,v),address(0),address(0),"");
        for(uint256 i;i<3;i++)tokens[i]=rid(tokenType,abi.encode(i+1));
        finalHelper=new FilesFinalValidator(address(ledger),legacy[4],legacy[5],legacy[6],legacy[7]);
        stanceHelper=new TagStanceValidator(address(ledger),legacy,ts,hs,lt,lh,tokenType,registry.describedRule().codehash,tokenDescriptor);
        files=new TagStanceIndex(address(ledger),legacy,ts,hs,lt,lh,finalHelper,address(finalHelper).codehash,stanceHelper,address(stanceHelper).codehash);
        index=files;ledger.setIndexModule(address(index));lens=new LensReader(ledger,index);
        require(admissions()==0&&index.attachedFrom()==1,"fixture did not start at genesis");
        prefixType=registry.register(keccak256("tag-prefix-consumer/1"),address(new TagPrefixRule()),new bytes32[](0));
    }
    function inventory(bytes32 author,bytes32 c) internal pure returns(bytes32){return keccak256(abi.encode(FAMILY,author,PURPOSE,c));}
    function seed() internal {
        for(uint256 i;i<3;i++)require(ledger.publish(tokenType,abi.encode(i+1))==tokens[i],"token preimage mismatch");
        conceptC=ledger.publish(ts[4],bytes.concat(abi.encode(bytes32("namespace-a")),bytes("shared")));
        conceptC2=ledger.publish(ts[4],bytes.concat(abi.encode(bytes32("namespace-b")),bytes("shared")));
        fileF=ledger.create(bytes32(uint256(1)));fileG=ledger.create(bytes32(uint256(2)));orphanH=ledger.create(bytes32(uint256(3)));
        directoryD=ledger.publish(legacy[6],abi.encode(ledger.create(bytes32(uint256(4)))));
        revision1=ledger.publish(legacy[0],abi.encode(fileF));revision2=ledger.publish(legacy[1],abi.encode(revision1,fileF));
        ledger.publish(legacy[4],bytes("f"));ledger.publish(legacy[4],bytes("g"));
        ledger.bind(FOLDER,directoryD,name("f"),fileF,0);ledger.bind(FOLDER,directoryD,name("g"),fileG,0);
    }
    function count(bytes32 key) internal view returns(uint64 n){(n,,,)=index.postingHead(key);}
    function test_tag_baseline_gap_controls() public {
        seed();
        alice.bind(TAG,fileF,conceptC,conceptC,0);bob.bind(TAG,fileF,conceptC,conceptC,0);
        ledger.bind(TAG,fileG,conceptC,conceptC,0);ledger.bind(TAG,orphanH,conceptC2,conceptC,0);
        require(count(Keys.backlinkList(conceptC))==4,"baseline target list control");
        require(count(inventory(pid(address(alice)),conceptC))==0,"old TAG unexpectedly has role inventory");
        alice.unbind(TAG,fileF,conceptC,1);
        (uint8 status,,,,)=lens.resolve(lensOf(address(alice),address(bob)),TAG,fileF,conceptC);
        require(status==2,"old removal no longer masks fallback");
    }
    function test_tag_fresh_inverse_is_exact_author_concept_coordinate() public {
        seed();
        alice.bind(PURPOSE,fileF,conceptC,tokens[0],0);alice.bind(PURPOSE,fileG,conceptC,tokens[0],0);
        alice.bind(PURPOSE,orphanH,conceptC2,tokens[0],0);bob.bind(PURPOSE,fileF,conceptC,tokens[0],0);
        require(count(inventory(pid(address(alice)),conceptC))==2,"new inverse missing exact role candidates");
        require(count(inventory(pid(address(alice)),conceptC2))==1&&count(inventory(pid(address(bob)),conceptC))==1,"author or same-label isolation lost");
    }
    function test_tag_wrong_token_matching_type_rejected() public {
        seed();bytes32 wrong=ledger.publish(tokenType,abi.encode(uint256(4)));
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.bind,(PURPOSE,fileF,conceptC,wrong,uint32(0))));
        require(!ok,"matching Type allowed non-profile token");
    }
    // Snapshot the canonical counters/evidence/head and every affected retained
    // family, including inherited scope state, before invoking public ingress.
    function snapshot(bytes32 subject,bytes32 concept_,bytes32 target) internal view returns(bytes32 h){
        (uint64 a,uint64 r,uint64 b,uint64 p)=ledger.counts();bytes32 principal=pid(address(this));
        bytes32 binding=Keys.binding(principal,Keys.position(PURPOSE,subject,concept_));
        (bool ok,bytes memory evidence)=address(ledger).staticcall(abi.encodeCall(ledger.evidence,(p+1)));require(ok);
        (,bytes memory head)=address(ledger).staticcall(abi.encodeCall(ledger.head,(binding)));
        h=keccak256(abi.encode(a,r,b,p,ledger.nonces(address(this)),evidence,head,ledger.bindingPosition(b+1),index.lastProcessed(),index.lastPublication()));
        bytes32[6] memory keys=[inventory(principal,concept_),Keys.scopeList(Keys.scope(principal,PURPOSE,subject)),Keys.historyList(binding),
            Keys.backlinkList(target),Keys.byTypeList(ts[4]),Keys.byAuthorList(principal)];
        for(uint256 i;i<keys.length;i++){
            (,bytes memory result)=address(index).staticcall(abi.encodeCall(index.postingHead,(keys[i])));
            h=keccak256(abi.encode(h,result,index.postingWord(keys[i],0),files.liveCount(keys[i]),files.lastMutation(keys[i])));
        }
    }
    function refuse(Ledger.Action[] memory a,bytes[] memory bodies,bytes32 subject,bytes32 c,bytes32 target) internal {
        bytes32 before_=snapshot(subject,c,target);
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.execute,(a,bodies,ledger.nonces(address(this)))));
        require(!ok,"invalid tag coordinate admitted");require(sel(err)==Ledger.E_INDEX.selector,"not rejected by qualified prefix index");
        require(snapshot(subject,c,target)==before_,"failed tag publication leaked state");
    }
    function test_tag_missing_wrong_concept_and_unsupported_subject_rejected() public {
        seed();bytes32 wrong=ledger.publish(BINARY,abi.encode(uint256(7)));
        refuse(one(aBind(PURPOSE,fileF,bytes32(0),tokens[0],0)),new bytes[](1),fileF,0,tokens[0]);
        refuse(one(aBind(PURPOSE,fileF,wrong,tokens[0],0)),new bytes[](1),fileF,wrong,tokens[0]);
        refuse(one(aBind(PURPOSE,wrong,conceptC,tokens[0],0)),new bytes[](1),wrong,conceptC,tokens[0]);
        refuse(one(aBind(PURPOSE,bytes32(uint256(777)),conceptC,tokens[0],0)),new bytes[](1),bytes32(uint256(777)),conceptC,tokens[0]);
    }
    function test_tag_invalid_then_valid_overwrite_rejects_whole_publication() public {
        seed();bytes32 wrong=ledger.publish(tokenType,abi.encode(uint256(4)));
        refuse(two(aBind(PURPOSE,fileF,conceptC,wrong,0),aBind(PURPOSE,fileF,conceptC,tokens[0],1)),new bytes[](2),fileF,conceptC,tokens[0]);
    }
    function test_tag_future_concept_prefix_rejected_before_later_rule() public {
        seed();bytes memory body=bytes.concat(abi.encode(bytes32("future")),bytes("concept"));bytes32 c=rid(ts[4],body);
        (,,uint64 bindings,)=ledger.counts();bytes memory consume=abi.encode(inventory(pid(address(this)),c),bindings+1);
        Ledger.Action[] memory a=new Ledger.Action[](3);bytes[] memory b=new bytes[](3);
        a[0]=aBind(PURPOSE,fileF,c,tokens[0],0);a[1]=aPublish(prefixType,consume);b[1]=consume;a[2]=aPublish(ts[4],body);b[2]=body;
        refuse(a,b,fileF,c,tokens[0]);
    }
    function test_tag_dependency_before_bind_exposes_validated_prefix_to_rule() public {
        seed();bytes memory body=bytes.concat(abi.encode(bytes32("future")),bytes("concept"));bytes32 c=rid(ts[4],body);
        (,,uint64 bindings,)=ledger.counts();bytes memory consume=abi.encode(inventory(pid(address(this)),c),bindings+1);
        Ledger.Action[] memory a=new Ledger.Action[](3);bytes[] memory b=new bytes[](3);
        a[0]=aPublish(ts[4],body);b[0]=body;a[1]=aBind(PURPOSE,fileF,c,tokens[0],0);a[2]=aPublish(prefixType,consume);b[2]=consume;
        ledger.execute(a,b,ledger.nonces(address(this)));require(count(inventory(pid(address(this)),c))==1,"validated prefix absent");
    }
    function test_tag_future_directory_and_create_subject_rejected() public {
        seed();bytes32 seed_=ledger.create(bytes32(uint256(77)));bytes memory body=abi.encode(seed_);bytes32 d=rid(legacy[6],body);
        bytes[] memory b=new bytes[](2);b[1]=body;
        refuse(two(aBind(PURPOSE,d,conceptC,tokens[0],0),aPublish(legacy[6],body)),b,d,conceptC,tokens[0]);
        bytes32 f=subjectOf(address(this),78);
        refuse(two(aBind(PURPOSE,f,conceptC,tokens[0],0),aCreate(bytes32(uint256(78)))),new bytes[](2),f,conceptC,tokens[0]);
    }
    function test_tag_corrupt_intrinsic_file_parent_mismatch_rejected() public {
        seed();
        // Explicit fault injection models corrupt retained input; no public
        // admission can create this exact-Type child with the wrong File.
        bytes32 words=keccak256(abi.encode(revision2,uint256(3)));
        fault.store(address(ledger),keccak256(abi.encode(uint256(1),words)),fileG);
        refuse(one(aBind(PURPOSE,revision2,conceptC,tokens[0],0)),new bytes[](1),revision2,conceptC,tokens[0]);
    }
    function test_tag_malformed_unbind_coordinate_rejected() public {
        seed();ledger.bind(PURPOSE,fileF,conceptC,tokens[0],0);
        bytes32 position=Keys.position(PURPOSE,fileF,conceptC);
        fault.store(address(ledger),bytes32(uint256(keccak256(abi.encode(position,uint256(10))))+2),conceptC2);
        refuse(one(aUnbind(PURPOSE,fileF,conceptC,1)),new bytes[](1),fileF,conceptC,tokens[0]);
    }
    function test_tag_transitions_keep_one_coordinate_and_real_history() public {
        seed();bytes32 key=inventory(pid(address(this)),conceptC);
        ledger.bind(PURPOSE,fileF,conceptC,tokens[0],0);uint64 first=index.postingAt(key,0);
        ledger.bind(PURPOSE,fileF,conceptC,tokens[1],1);ledger.bind(PURPOSE,fileF,conceptC,tokens[2],2);ledger.bind(PURPOSE,fileF,conceptC,tokens[0],3);
        ledger.unbind(PURPOSE,fileF,conceptC,4);
        bytes32 binding=Keys.binding(pid(address(this)),Keys.position(PURPOSE,fileF,conceptC));
        (uint8 state,uint32 revision,,,uint64 ordinal,bytes32 target)=ledger.head(binding);
        require(state==2&&revision==5&&target==0&&ordinal==first&&first!=0,"UNBIND reset physical coordinate");
        require(count(key)==1&&count(Keys.historyList(binding))==5,"transition duplicated inverse or lost history");
        (uint64 n,uint64 live_,,)=index.postingHead(Keys.backlinkList(tokens[0]));require(n==2&&live_==0,"ASSERT backlink history/live wrong");
        for(uint256 i=1;i<3;i++){(n,live_,,)=index.postingHead(Keys.backlinkList(tokens[i]));require(n==1&&live_==0,"other token backlink wrong");}
    }
    function test_tag_withdrawal_keeps_stance_and_name_after_bind_still_works() public {
        seed();ledger.bind(PURPOSE,revision2,conceptC,tokens[0],0);
        (,uint64 first,,)=ledger.record(tokens[0]);ledger.execute(one(aWithdraw(first)),new bytes[](1),ledger.nonces(address(this)));
        (uint8 state,,bytes32 target)=headOf(address(this),PURPOSE,revision2,conceptC);require(state==1&&target==tokens[0],"WITHDRAW retracted stance");
        bytes[] memory b=new bytes[](2);b[1]=bytes("late");
        ledger.execute(two(aBind(FOLDER,directoryD,name("late"),orphanH,0),aPublish(legacy[4],b[1])),b,ledger.nonces(address(this)));
        require(files.liveCount(Keys.scopeList(Keys.scope(pid(address(this)),FOLDER,directoryD)))==3,"inherited Name final semantics changed");
    }
    function freshIndex(TagStanceValidator validator,bytes32 hash_) internal returns(TagStanceIndex){
        return new TagStanceIndex(address(ledger),legacy,ts,hs,lt,lh,finalHelper,address(finalHelper).codehash,validator,hash_);
    }
    function test_tag_ordinary_runtime_and_actual_initcode_fit() public view {
        require(address(files).code.length<=24576&&address(stanceHelper).code.length<=24576,"ordinary runtime exceeded");
        bytes memory args=abi.encode(address(ledger),legacy,ts,hs,lt,lh,finalHelper,address(finalHelper).codehash,stanceHelper,address(stanceHelper).codehash);
        require(type(TagStanceIndex).creationCode.length+args.length<=49152,"index actual initcode exceeded");
        args=abi.encode(address(ledger),legacy,ts,hs,lt,lh,tokenType,registry.describedRule().codehash,tokenDescriptor);
        require(type(TagStanceValidator).creationCode.length+args.length<=49152,"validator actual initcode exceeded");
    }
    function test_tag_helper_hash_configuration_and_code_drift_refused() public {
        try this.construct(stanceHelper,bytes32(uint256(1))){revert("wrong helper runtime pin accepted");}catch{}
        bytes32[5] memory wrong=ts;wrong[4]=BINARY;
        TagStanceValidator other=new TagStanceValidator(address(ledger),legacy,wrong,hs,lt,lh,tokenType,registry.describedRule().codehash,tokenDescriptor);
        try this.construct(other,address(other).codehash){revert("wrong helper Files configuration accepted");}catch{}
        seed();fault.etch(address(stanceHelper),hex"00");
        refuse(one(aBind(PURPOSE,fileF,conceptC,tokens[0],0)),new bytes[](1),fileF,conceptC,tokens[0]);
    }
    function construct(TagStanceValidator helper,bytes32 hash_) external {freshIndex(helper,hash_);}
    function test_tag_exact_retained_described_bytes_are_mandatory() public {
        bytes memory changed=bytes.concat(tokenDescriptor,hex"00");
        try new TagStanceValidator(address(ledger),legacy,ts,hs,lt,lh,tokenType,registry.describedRule().codehash,changed){revert("wrong descriptor bytes accepted");}catch{}
        seed();require(keccak256(registry.descriptorBytes(tokenType))==keccak256(tokenDescriptor),"described source absent");
        require(keccak256(stanceHelper.profileBytes())==TagStanceIndex(address(files)).tagProfileHash(),"profile preimage not retained");
    }
    function fullRevisions() internal returns(bytes32[6] memory revisions){
        bytes32 raw=ledger.publish(ts[0],abi.encode(sha256("")));
        bytes32 descriptor_=ledger.publish(ts[1],abi.encode(raw,uint256(1),uint256(0),uint256(1),uint256(0),sha256(""),uint256(0),uint256(0),bytes32(0),uint256(0),sha256("")));
        bytes32 storedRoot=ledger.publish(ts[2],abi.encode(descriptor_,fileF));bytes32 storedChild=ledger.publish(ts[3],abi.encode(storedRoot,descriptor_,fileF));
        bytes memory recipe=abi.encode(LiveFilesLayout.Recipe(1,block.chainid,LiveFilesLayout.VENUE,address(provider),address(provider).codehash,
            LiveFilesLayout.SELECTOR,bytes32(uint256(7)),quote,1,50000,64,address(adapter)));
        bytes32 liveDescriptor=ledger.publish(lt[0],recipe);bytes32 liveRoot=ledger.publish(lt[1],abi.encode(liveDescriptor,fileF));
        bytes32 liveChild=ledger.publish(lt[2],abi.encode(storedChild,liveDescriptor,fileF));
        revisions=[revision1,revision2,storedRoot,storedChild,liveRoot,liveChild];
    }
    function equalPosting(IndexModule other,bytes32 key) internal view {
        (,bytes memory a)=address(index).staticcall(abi.encodeCall(index.postingHead,(key)));
        (,bytes memory b)=address(other).staticcall(abi.encodeCall(other.postingHead,(key)));require(keccak256(a)==keccak256(b),"replay head differs");
        for(uint64 i;i<count(key);i++)require(index.postingAt(key,i)==other.postingAt(key,i),"replay ordinal differs");
    }
    function test_tag_full_supported_revision_domain_replay_and_checked_cutover() public {
        seed();bytes32[6] memory revisions=fullRevisions();
        for(uint256 i;i<6;i++)ledger.bind(PURPOSE,revisions[i],conceptC,tokens[i%3],0);
        ledger.bind(PURPOSE,directoryD,conceptC,tokens[0],0);ledger.bind(PURPOSE,orphanH,conceptC,tokens[1],0);
        alice.bind(PURPOSE,fileF,conceptC,tokens[0],0);bob.bind(PURPOSE,fileG,conceptC2,tokens[0],0);
        alice.bind(PURPOSE,fileF,conceptC,tokens[1],1);alice.bind(PURPOSE,fileF,conceptC,tokens[2],2);alice.bind(PURPOSE,fileF,conceptC,tokens[0],3);alice.unbind(PURPOSE,fileF,conceptC,4);
        (,uint64 first,,)=ledger.record(tokens[0]);ledger.execute(one(aWithdraw(first)),new bytes[](1),ledger.nonces(address(this)));
        TagStanceIndex replay=freshIndex(stanceHelper,address(stanceHelper).codehash);
        (uint8 status,,)=replay.coverage(FAMILY,0);require(status==1,"empty replacement falsely complete");
        (,,,uint64 publications)=ledger.counts();provider.update(42,true,1,address(adapter));
        for(uint64 i;i<publications;i++)replay.replayNextPublication();
        require(replay.manifestHash()==index.manifestHash()&&replay.lastProcessed()==admissions()&&replay.lastPublication()==publications,"replay manifest/frontier differs");
        bytes32[3] memory authors=[pid(address(this)),pid(address(alice)),pid(address(bob))];
        for(uint256 i;i<3;i++){equalPosting(replay,inventory(authors[i],conceptC));equalPosting(replay,inventory(authors[i],conceptC2));equalPosting(replay,Keys.byAuthorList(authors[i]));}
        for(uint256 i;i<3;i++)equalPosting(replay,Keys.backlinkList(tokens[i]));
        // Enumerate actual canonical admissions to compare every inherited
        // affected family, not a hand-picked final aggregate.
        for(uint64 i=1;i<=admissions();i++){
            (uint8 kind,,uint64 publication,uint64 ordinal,,,bytes32 id,bytes32 t)=ledger.admission(i);
            bytes32 author=ledger.publicationContext(publication).principalId;
            if(kind==1||kind==2){
                // PUBLISH retains bodyHash/Type, not Record/Type; REUSE keeps
                // Record/zero. Resolve these actual canonical wire shapes.
                if(kind==1)id=Keys.recordFromHash(t,id);else(t,,)=FilesLayout.header(ledger,id);
                equalPosting(replay,Keys.byTypeList(t));equalPosting(replay,Keys.uniqueByTypeList(t));equalPosting(replay,Keys.byRecordList(id));
                bytes32[] memory refs=registry.refTypes(t);for(uint8 j;j<refs.length;j++)equalPosting(replay,Keys.referenceList(t,j,FilesLayout.word(ledger,id,j)));
                if(t==ts[1]){equalPosting(replay,Keys.scalarList(t,0,2,FilesLayout.word(ledger,id,4)));equalPosting(replay,Keys.digestList(bytes32(uint256(1)),FilesLayout.word(ledger,id,5)));}
            }else if(kind==3||kind==4){
                bytes32 position=ledger.bindingPosition(ordinal);(bytes32 p,bytes32 s,)=ledger.positionCell(position);
                bytes32 key=Keys.scopeList(Keys.scope(author,p,s));equalPosting(replay,key);equalPosting(replay,Keys.historyList(Keys.binding(author,position)));
                if(kind==3)equalPosting(replay,Keys.backlinkList(id));
                require(files.liveCount(key)==replay.liveCount(key)&&files.lastMutation(key)==replay.lastMutation(key),"scope companion differs");
                for(uint64 j;j<files.liveCount(key);j++)require(files.liveAt(key,j)==replay.liveAt(key,j),"live scope value differs");
            }
        }
        for(uint256 i;i<index.manifestCount();i++){
            bytes32 family=index.manifestEntry(i).family;
            (,bytes memory a)=address(index).staticcall(abi.encodeCall(index.coverage,(family,bytes32(0))));
            (,bytes memory b)=address(replay).staticcall(abi.encodeCall(replay.coverage,(family,bytes32(0))));require(keccak256(a)==keccak256(b),"coverage differs");
        }
        ledger.replaceIndexWhenReady(IIndexReadiness.ReplacementRequest(address(replay),address(index),admissions(),publications,index.manifestHash(),address(replay).codehash,0));
        require(ledger.indexModule()==address(replay),"checked cutover failed");
    }
    function test_tag_later_concept_cannot_repair_earlier_replay() public {
        seed();(,,,uint64 validPublications)=ledger.counts();ledger.setIndexModule(address(0));
        bytes memory body=bytes.concat(abi.encode(bytes32("future")),bytes("historical"));bytes32 c=rid(ts[4],body);
        ledger.bind(PURPOSE,fileF,c,tokens[0],0);ledger.publish(ts[4],body);
        TagStanceIndex replay=freshIndex(stanceHelper,address(stanceHelper).codehash);
        for(uint64 i;i<validPublications;i++)replay.replayNextPublication();uint64 before_=replay.lastProcessed();
        (bool ok,)=address(replay).call(abi.encodeCall(replay.replayNextPublication,()));
        require(!ok&&replay.lastProcessed()==before_&&replay.lastPublication()==validPublications,"today repaired historical invalid prefix");
        (uint64 n,,,)=replay.postingHead(inventory(pid(address(this)),c));require(n==0,"failed replay leaked inverse");
    }
    function test_tag_maximum_existing_concept_revision_and_name_domains() public {
        seed();bytes memory label=new bytes(128);for(uint256 i;i<label.length;i++)label[i]=bytes1("x");
        bytes32 c=ledger.publish(ts[4],bytes.concat(abi.encode(bytes32("max-label")),label));
        bytes32 r=ledger.publish(legacy[0],bytes.concat(abi.encode(fileF),new bytes(8160)));
        bytes32 child=ledger.publish(legacy[1],bytes.concat(abi.encode(r,fileF),new bytes(8128)));
        ledger.bind(PURPOSE,child,c,tokens[0],0);
        bytes memory name_=new bytes(255);for(uint256 i;i<name_.length;i++)name_[i]=bytes1("z");
        bytes[] memory b=new bytes[](2);b[1]=name_;
        ledger.execute(two(aBind(FOLDER,directoryD,keccak256(name_),fileF,0),aPublish(legacy[4],name_)),b,ledger.nonces(address(this)));
        require(count(inventory(pid(address(this)),c))==1,"supported maximum domain lost");
    }
}
