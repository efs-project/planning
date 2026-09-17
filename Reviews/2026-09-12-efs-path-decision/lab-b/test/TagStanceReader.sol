// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LensReader} from "../src/LensReader.sol";
import {Ledger} from "../src/Ledger.sol";
import {TagStanceIndex,TagStanceProfile,TagStanceValidator} from "./TagStanceProfile.sol";
import {Keys} from "../src/Keys.sol";
import {IIndexModule} from "../src/Interfaces.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {FilesDirectoryLayout} from "./FilesDirectoryProfile.sol";

/// Fixed, separately deployed retained-history and inventory adapter.
contract TagStanceLens is LensReader {
    bytes32 private constant PURPOSE=keccak256("efs.lab/tag-stance/1");
    bytes32 private constant FAMILY=keccak256("efs.lab/tag-role-inventory/1");
    bytes32 public immutable profileHash;
    TagStanceValidator public immutable validator;
    constructor(Ledger c,TagStanceIndex i) LensReader(c,i){profileHash=i.tagProfileHash();validator=i.stanceValidator();}
    function scan(bytes32[] calldata principals,bytes32 direction,bytes32 exact,PrincipalCursor calldata cursor,uint256 budget)
        external view returns(ScanPage memory){
        if(principals.length==0||principals.length>64||budget==0||budget>256||(direction!=PURPOSE&&direction!=FAMILY))revert E_LENS();
        return _scan(principals,direction,exact,cursor,budget);
    }
    function checkHistory(uint64 origin,bytes32 execution) external view {_historicalBasis(origin,execution);}
    /// Catchable, authenticated retained observation. The inherited _headAt is
    /// the only history selection engine; we do not reconstruct another fold.
    function observation(bytes32 principal,bytes32 position,uint64 origin) external view
        returns(uint8 state,bytes32 token,uint32 revision,uint64 at,uint64 probes)
    {
        (uint8 cov,,)=index.coverage(index.FAMILY_HISTORY(),Keys.historyList(Keys.binding(principal,position)));
        if(cov!=COMPLETE)revert E_CURSOR();
        (state,token,revision,at)=_headAt(principal,position,origin);
        (,,uint64 nowAt,)=_selectionHead(Keys.binding(principal,position));
        if(nowAt>origin){
            (uint64 n,,,)=index.postingHead(Keys.historyList(Keys.binding(principal,position)));
            // The inherited upper-bound path is determined by n and the
            // returned revision. Count its actual postingAt probes, including
            // the final selected entry, without a second history search.
            uint64 lo;uint64 hi=n;
            while(lo<hi){uint64 mid=(lo+hi)/2;++probes;if(mid<revision)lo=mid+1;else hi=mid;}
            if(revision!=0)++probes;
        }
        if(state==0){if(revision!=0||at!=0||token!=0)revert E_CURSOR();return(state,token,revision,at,probes);}
        // This specialized observation vocabulary has no RELEASE category.
        // Never relabel a released HEAD/stance as untouched or as a mask.
        if(state>2||at==0||at>origin)revert E_CURSOR();
        (uint8 kind,,uint64 publication,uint64 ordinal,uint32 expected,,bytes32 target,)=ledger.admission(at);
        if(kind!=(state==1?3:4)||expected+1!=revision||ledger.bindingPosition(ordinal)!=position
            ||ledger.publicationContext(publication).principalId!=principal||(state==1&&target!=token))revert E_CURSOR();
        (bytes32 purpose,bytes32 subject,bytes32 concept)=ledger.positionCell(position);
        if(Keys.position(purpose,subject,concept)!=position)revert E_CURSOR();
        if(purpose==PURPOSE&&state==1){
            IIndexModule.Effect memory effect;
            effect.kind=3;effect.admission=at;effect.author=principal;effect.bindingOrdinal=ordinal;
            effect.bindingKey=Keys.binding(principal,position);effect.scopeKey=Keys.scope(principal,purpose,subject);effect.target=token;
            validator.validate(effect);
        }
    }
    function _listKey(bytes32 principal,bytes32 direction,bytes32 exact) private pure returns(bytes32){
        return direction==PURPOSE?Keys.scopeList(Keys.scope(principal,PURPOSE,exact)):TagStanceProfile.inventory(principal,exact);
    }
    function _first(bytes32 principal,bytes32 position) private view returns(uint64 first){
        bytes32 key=Keys.historyList(Keys.binding(principal,position));(uint64 n,,,)=index.postingHead(key);
        if(n==0)return 0;first=index.postingAt(key,0);if(first==0)revert E_CURSOR();
    }
    /// Only inventory-prefix discovery is specialized here; history and cursor
    /// layout/finishing use the reviewed LensReader mechanism unchanged.
    function _scan(bytes32[] memory principals,bytes32 direction,bytes32 exact,PrincipalCursor memory cursor,uint256 budget)
        internal view override returns(ScanPage memory page)
    {
        _historicalBasis(cursor.basisAdmission,cursor.executionSet);
        (uint64 current,,,)=ledger.counts();
        (uint8 cov,uint64 from,uint64 through)=index.coverage(direction==PURPOSE?index.FAMILY_SCOPE():FAMILY,0);
        if(cov!=COMPLETE||from!=1||through!=current)revert E_CURSOR();
        uint64[] memory counts=new uint64[](principals.length);
        for(uint256 principalIndex;principalIndex<principals.length;principalIndex++){
            bytes32 key=_listKey(principals[principalIndex],direction,exact);(uint64 hi,,,)=index.postingHead(key);uint64 lo;
            while(lo<hi){
                uint64 mid=lo+(hi-lo)/2;bytes32 position=ledger.bindingPosition(index.postingAt(key,mid));
                uint64 first=_first(principals[principalIndex],position);if(first==0)revert E_CURSOR();++page.prefixProbes;
                if(first<=cursor.basisAdmission)lo=mid+1;else hi=mid;
            }
            counts[principalIndex]=lo;page.rawTotal+=lo;
        }
        page.inventoryPin=keccak256(abi.encode("efs.tag-retained-prefix/1",profileHash,cursor.basisAdmission,principals,direction,exact,counts));
        page.items=new Selection[](budget);uint256 filled;uint256 k=cursor.lensIndex;uint64 j=cursor.rawIndex;
        if(k>principals.length||(k==principals.length&&j!=0)||(k<principals.length&&j>counts[k]))revert E_CURSOR();
        while(k<principals.length){
            bytes32 key=_listKey(principals[k],direction,exact);
            while(j<counts[k]){
                if(page.scanned>=budget){cursor.lensIndex=uint8(k);cursor.rawIndex=j;return _finishScan(page,cursor,filled,PARTIAL);}
                bytes32 position=ledger.bindingPosition(index.postingAt(key,j++));++page.scanned;
                (bytes32 p,bytes32 subject,bytes32 concept)=ledger.positionCell(position);
                if(p!=PURPOSE||position!=Keys.position(p,subject,concept)||(direction==PURPOSE?subject:concept)!=exact)revert E_CURSOR();
                bool seen;
                for(uint256 i;i<k;i++){uint64 first=_first(principals[i],position);++page.hydrations;if(first!=0&&first<=cursor.basisAdmission){seen=true;break;}}
                if(seen)continue;
                page.items[filled++]=Selection(position,k,0,0,0);++cursor.selectedSoFar;cursor.position=position;
            }
            ++k;j=0;
        }
        cursor.lensIndex=uint8(principals.length);cursor.rawIndex=0;return _finishScan(page,cursor,filled,COMPLETE);
    }
}

contract TagStanceReader {
    Ledger public immutable ledger;
    TagStanceIndex public immutable index;
    TagStanceLens public immutable lens;
    bytes32 public immutable lensHash;
    error E_CURSOR(); error E_LENS();
    struct Basis {uint64 admission;uint64 generation;uint64 epoch;bytes32 execution;bytes32 realm;bytes32 profile;}
    // direction1 tagsOnSubject,2 subjectsForConcept. mode1 File,2 exact
    // revision,3 selected revision,4 Directory. Diagnostic HEAD is explicit.
    struct Query {uint8 direction;uint8 mode;bytes32 exact;bool diagnosticHead;}
    // assessment0 UNKNOWN,1 PRESENT,2 NOT_PRESENT,3 NOT_APPLICABLE.
    struct Row {bytes32 subject;bytes32 concept;bytes32 intrinsicFile;bytes32 author;bytes32 token;uint8 stance;uint8 assessment;uint32 revision;uint64 admission;uint8 headStatus;}
    // kind0 UNKNOWN,1 untouched,2 ASSERT,3 DENY,4 SILENT,5 stance tombstone,
    // 6 live HEAD,7 HEAD tombstone. Ordering is the supplied closed Lens.
    struct Observation {bytes32 author;bytes32 target;uint32 revision;uint64 admission;uint8 kind;}
    struct Diagnostic {Basis basis;bytes32 subject;bytes32 concept;bytes32 intrinsicFile;Observation[] stances;Observation[] heads;bool complete;bool stanceDisagreement;bool headDisagreement;}
    event DiagnosticRecorded(bytes encodedDiagnostic);
    struct TagPage {Row[] rows;uint8 scanStatus;bool startsAtOrigin;uint64 scanned;uint64 rawTotal;uint64 selectedSoFar;bytes continuation;bytes32 inventoryPin;uint64 prefixProbes;uint64 historyProbes;uint64 joins;uint64 observedCurrent;uint64 unknowns;uint8 headStatus;uint8 queryAssessment;}
    bytes32 private constant PURPOSE=keccak256("efs.lab/tag-stance/1");
    bytes32 private constant FAMILY=keccak256("efs.lab/tag-role-inventory/1");
    bytes32 private constant HEAD=keccak256("efs2/purpose/head/1");
    bytes32 public immutable profileHash;
    bytes32 public immutable coreHash;
    bytes32 public immutable indexHash;
    TagStanceValidator public immutable validator;
    bytes32 public immutable validatorHash;
    TagStanceProfile.Config private _config;
    error E_QUERY();
    constructor(Ledger c,TagStanceIndex i,TagStanceLens l,bytes32 expectedLensHash){
        if(address(l).code.length==0||address(l).codehash!=expectedLensHash||address(l.ledger())!=address(c)
            ||address(l.index())!=address(i)||l.profileHash()!=i.tagProfileHash())revert E_QUERY();
        ledger=c;index=i;lens=l;lensHash=expectedLensHash;
        profileHash=i.tagProfileHash();coreHash=address(c).codehash;indexHash=address(i).codehash;
        validator=i.stanceValidator();validatorHash=i.stanceValidatorHash();
        bytes memory preimage=validator.profileBytes();
        (,,,TagStanceProfile.Config memory cfg,,,,,)=abi.decode(preimage,(bytes32,bytes32,bytes32,TagStanceProfile.Config,bytes32[3],uint256[3],uint8[6],uint16[6],uint8[6]));
        if(keccak256(TagStanceProfile.profile(cfg))!=profileHash||address(validator).codehash!=validatorHash)revert E_QUERY();
        _config=cfg;
    }
    function _basis(bytes32[] memory principals,Basis memory b) private view {
        if(principals.length==0||principals.length>64||b.generation!=index.generation()||b.epoch!=ledger.registry().epoch()
            ||b.realm!=ledger.realmId()||b.profile!=profileHash||b.execution!=ledger.executionSet()
            ||ledger.indexModule()!=address(index)||address(ledger).codehash!=coreHash||address(index).codehash!=indexHash
            ||address(validator).codehash!=validatorHash||address(lens).codehash!=lensHash)revert E_CURSOR();
        for(uint256 i;i<principals.length;i++){
            if(principals[i]==0)revert E_LENS();
            for(uint256 j;j<i;j++)if(principals[j]==principals[i])revert E_LENS();
        }
    }
    function _assess(bytes32[] memory principals,bytes32 subject,bytes32 concept,uint64 origin)
        private view returns(Row memory r,uint64 probes,uint64 joins)
    {
        r.subject=subject;r.concept=concept;r.assessment=2;
        bytes32 position=Keys.position(PURPOSE,subject,concept);
        for(uint256 i;i<principals.length;i++){
            ++joins;
            try lens.observation(principals[i],position,origin) returns(uint8 state,bytes32 token,uint32 rev,uint64 at,uint64 work){
                probes+=work;
                if(state==0||state==2)continue;
                uint8 stance;
                for(uint8 j=1;j<=3;j++)if(token==TagStanceProfile.token(_config.tokenType,j))stance=j;
                if(stance==3)continue;
                r.author=principals[i];r.token=token;r.revision=rev;r.admission=at;r.stance=stance;
                r.assessment=stance==1?1:stance==2?2:0;return(r,probes,joins);
            }catch{r.assessment=0;r.author=principals[i];return(r,probes,joins);}
        }
    }
    function assess(bytes32[] calldata principals,bytes32 subject,bytes32 concept,Basis calldata b) external view returns(Row memory r){
        _basis(principals,b);
        (uint8 kind,bytes32 file)=classify(subject,b.admission);
        if(kind==0||!_concept(concept,b.admission)){r.subject=subject;r.concept=concept;return r;}
        try lens.checkHistory(b.admission,b.execution){(r,,)=_assess(principals,subject,concept,b.admission);}
        catch{r.subject=subject;r.concept=concept;}
        r.intrinsicFile=file;
    }
    function _diagnosticObservation(bytes32 author,bytes32 position,uint64 origin,bool head) private view returns(Observation memory o){
        o.author=author;
        try lens.observation(author,position,origin) returns(uint8 state,bytes32 target,uint32 revision,uint64 at,uint64){
            o.target=target;o.revision=revision;o.admission=at;
            if(state==0)o.kind=1;
            else if(head)o.kind=state==1?6:7;
            else if(state==2)o.kind=5;
            else for(uint8 j=1;j<=3;j++)if(target==TagStanceProfile.token(_config.tokenType,j))o.kind=j+1;
        }catch{} // UNKNOWN remains attributed, never silently skipped.
    }
    /// Bounded exact-coordinate diagnostics, not a new inventory scan or winner.
    /// All ordered observations survive. Silence/untouched are not votes;
    /// complete=false qualifies any disagreement flag when history is unknown.
    function diagnose(bytes32[] memory principals,bytes32 subject,bytes32 concept,Basis memory b,bool includeHead)
        public view returns(Diagnostic memory d)
    {
        _basis(principals,b);d.basis=b;d.subject=subject;d.concept=concept;
        (uint8 kind,bytes32 file)=classify(subject,b.admission);d.intrinsicFile=file;
        if(kind==0||!_concept(concept,b.admission)||(includeHead&&file==0))revert E_QUERY();
        d.stances=new Observation[](principals.length);d.heads=new Observation[](includeHead?principals.length:0);
        bool available;try lens.checkHistory(b.admission,b.execution){available=true;}catch{}
        d.complete=available;bool asserted;bool denied;bool touchedHead;uint8 firstKind;bytes32 firstTarget;
        for(uint256 i;i<principals.length;i++){
            Observation memory o;
            if(available)o=_diagnosticObservation(principals[i],Keys.position(PURPOSE,subject,concept),b.admission,false);
            else o.author=principals[i];
            d.stances[i]=o;if(o.kind==0)d.complete=false;else if(o.kind==2)asserted=true;else if(o.kind==3)denied=true;
            if(includeHead){
                if(available)o=_diagnosticObservation(principals[i],Keys.position(HEAD,file,0),b.admission,true);
                else o=Observation(principals[i],0,0,0,0);
                d.heads[i]=o;if(o.kind==0)d.complete=false;
                else if(o.kind==6||o.kind==7){
                    if(touchedHead&&(o.kind!=firstKind||o.target!=firstTarget))d.headDisagreement=true;
                    if(!touchedHead){touchedHead=true;firstKind=o.kind;firstTarget=o.target;}
                }
            }
        }
        d.stanceDisagreement=asserted&&denied;
    }
    function recordDiagnostic(bytes32[] calldata principals,bytes32 subject,bytes32 concept,Basis calldata b,bool includeHead) external {
        emit DiagnosticRecorded(abi.encode(diagnose(principals,subject,concept,b,includeHead)));
    }
    function classify(bytes32 subject,uint64 origin) public view returns(uint8 kind,bytes32 file){
        uint64 created=ledger.subjectCreatedAt(subject);if(created!=0&&created<=origin)return(1,subject);
        if(FilesDirectoryLayout.validate(ledger,_config.directoryType,subject,origin))return(4,0);
        (bytes32 t,uint64 first,uint32 size)=FilesLayout.header(ledger,subject);
        if(first==0||first>origin||size>8192)return(0,0);
        for(uint256 i;i<6;i++)if(t==_config.revisions[i]){
            uint256 offset=i==0?0:i==1||i==2||i==4?1:2;
            if(size<(offset+1)*32||(i>=2&&size!=(offset+1)*32))return(0,0);
            file=FilesLayout.word(ledger,subject,offset);uint64 creation=ledger.subjectCreatedAt(file);
            if(file==0||creation==0||creation>=first)return(0,0);
            return(2,file);
        }
    }
    function _concept(bytes32 id,uint64 origin) private view returns(bool){
        (bytes32 t,uint64 first,,bytes memory body)=ledger.record(id);
        if(t!=_config.conceptType||first==0||first>origin||body.length<33||body.length>160||bytes32(body)==0||Keys.record(t,body)!=id)return false;
        for(uint256 i=32;i<body.length;i++)if(uint8(body[i])<32||uint8(body[i])>126)return false;
        return true;
    }
    function _head(bytes32[] memory principals,bytes32 file,uint64 origin,bool diagnostic)
        private view returns(uint8 status,bytes32 revision,uint64 probes,uint64 joins)
    {
        bytes32 position=Keys.position(HEAD,file,0);bool found;
        for(uint256 i;i<principals.length;i++){
            ++joins;
            try lens.observation(principals[i],position,origin) returns(uint8 state,bytes32 target,uint32,uint64,uint64 work){
                probes+=work;if(state==0)continue;
                if(!diagnostic)return(state,target,probes,joins);
                if(found)return(3,0,probes,joins);
                found=true;status=state;revision=target;
            }catch{return(4,0,probes,joins);}
        }
    }
    function tagsOnSubject(bytes32[] calldata principals,uint8 mode,bytes32 subject,bool diagnostic,Basis calldata b,bytes calldata next,uint256 budget)
        external view returns(TagPage memory){return _read(principals,Query(1,mode,subject,diagnostic),b,next,budget);}
    function subjectsForConcept(bytes32[] calldata principals,uint8 mode,bytes32 concept,bool diagnostic,Basis calldata b,bytes calldata next,uint256 budget)
        external view returns(TagPage memory){return _read(principals,Query(2,mode,concept,diagnostic),b,next,budget);}
    function readPage(bytes32[] calldata principals,Query calldata q,Basis calldata b,bytes calldata next,uint256 budget)
        external view returns(TagPage memory){return _read(principals,q,b,next,budget);}
    function _read(bytes32[] memory principals,Query memory q,Basis memory b,bytes memory next,uint256 budget)
        private view returns(TagPage memory page)
    {
        _basis(principals,b);if(q.direction<1||q.direction>2||q.mode<1||q.mode>4||q.exact==0||budget==0||budget>256)revert E_QUERY();
        page.startsAtOrigin=next.length==0;(page.observedCurrent,,,)=ledger.counts();
        if(b.admission>page.observedCurrent)revert E_CURSOR();
        try lens.checkHistory(b.admission,b.execution){}catch{return page;}
        if(q.direction==2){if(!_concept(q.exact,b.admission))revert E_QUERY();}
        else{(uint8 kind,)=classify(q.exact,b.admission);if(kind!=(q.mode==3?1:q.mode))revert E_QUERY();}
        bytes32 exact=q.exact;bytes32 direction=q.direction==1?PURPOSE:FAMILY;
        if(q.direction==1&&q.mode==3){
            (uint8 hs,bytes32 revision,uint64 probes,uint64 joins)=_head(principals,q.exact,b.admission,q.diagnosticHead);
            page.historyProbes+=probes;page.joins+=joins;page.headStatus=hs;
            if(hs!=1){if(hs==3||hs==4)page.unknowns=1;else page.queryAssessment=3;return page;}exact=revision;
            (uint8 kind,bytes32 file)=classify(exact,b.admission);if(kind!=2||file!=q.exact){page.unknowns=1;return page;}
        }
        page.queryAssessment=1;
        bytes32 queryHash=keccak256(abi.encode(msg.sender,address(this),principals,q,b));
        LensReader.PrincipalCursor memory cursor;
        if(next.length==0)cursor=LensReader.PrincipalCursor(b.admission,b.generation,b.epoch,b.execution,keccak256(abi.encode(direction,exact)),keccak256(abi.encode(principals)),0,0,0,0);
        else{
            bytes32 previous;(previous,cursor)=abi.decode(next,(bytes32,LensReader.PrincipalCursor));
            if(previous!=queryHash||cursor.basisAdmission!=b.admission||cursor.indexGeneration!=b.generation||cursor.rulesEpoch!=b.epoch
                ||cursor.executionSet!=b.execution||cursor.scopeKey!=keccak256(abi.encode(direction,exact))||cursor.lensHash!=keccak256(abi.encode(principals)))revert E_CURSOR();
        }
        LensReader.ScanPage memory source=lens.scan(principals,direction,exact,cursor,budget);
        page.scanStatus=source.status;page.scanned=source.scanned;page.rawTotal=source.rawTotal;page.selectedSoFar=source.selectedSoFar;
        page.inventoryPin=source.inventoryPin;page.prefixProbes=source.prefixProbes;page.joins+=source.hydrations;page.rows=new Row[](source.items.length);
        for(uint256 i;i<source.items.length;i++){
            (,bytes32 subject,bytes32 concept)=ledger.positionCell(source.items[i].position);
            (Row memory r,uint64 probes,uint64 joins)=_assess(principals,subject,concept,b.admission);
            page.historyProbes+=probes;page.joins+=joins;
            (uint8 kind,bytes32 file)=classify(subject,b.admission);r.intrinsicFile=file;
            // Unknown testimony stays unknown even if a separate predicate is
            // negative. It cannot disappear into a filtered absence proof.
            if(r.assessment!=0){
                if(kind==0)r.assessment=0;
                else if(q.mode==3&&kind==2){
                    (uint8 hs,bytes32 rev,uint64 work,uint64 reads)=_head(principals,file,b.admission,q.diagnosticHead);
                    page.historyProbes+=work;page.joins+=reads;r.headStatus=hs;
                    if(hs==3||hs==4)r.assessment=0;else if(hs!=1||rev!=subject)r.assessment=3;
                }else if(kind!=q.mode)r.assessment=3;
            }
            if(r.assessment==0)++page.unknowns;page.rows[i]=r;
        }
        if(source.status==1)page.continuation=abi.encode(queryHash,source.next);
    }
}
