import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {E,ROOT,withWorld,artifact} from '../scripts/world.mjs';
test('expanded world retains old exact runtimes and admits/export raw and canonical with distinct identity',{timeout:180000},async()=>{
  await withWorld(async w=>{
    const c=w.client;
    assert.ok(w.config.rawType,'world must register explicit raw Type');
    const old=JSON.parse(readFileSync(ROOT+'evidence/benchmark-2.json'));
    for(const name of ['BytesValidator','Uint256Validator'])assert.equal(w.provenance.runtimes[name].codeHash,old.provenance.runtimes[name].codeHash);
    assert.equal(w.provenance.sourcePins['ExactTypeRegistry.sol'],old.provenance.sourcePins['ExactTypeRegistry.sol']);
    await c.write('ensureRoot',[]);const root=(await c.call('rootId',[w.config.namespace])).value;
    const raw='0xef0080ff0000';
    for(const typeId of [w.config.rawType,w.config.bytesType]){
      const body=c.encodePayload(typeId,raw),a=await c.write('createFile',[root,E.toUtf8Bytes(typeId===w.config.rawType?'raw':'canonical'),typeId,body]);
      const info=(await c.call('fileInfo',[a.fileId])).value;
      const independently=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),typeId,body]));
      assert.equal(info.recordId,independently);
      assert.equal(E.hexlify(c.decodePayload(typeId,(await c.record(info.recordId)).value.body)),raw);
    }
    // An opaque descriptor sharing a supported runtime is still an unknown Type to the viewer.
    const registry=(await c.call('types')).value,ti=new E.Interface(artifact('ExactTypeRegistry').abi);
    const descriptor=E.toUtf8Bytes('unknown application byte meaning'),validator=w.provenance.runtimes.RawBytesValidator.address;
    const unknown=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[E.id('EFS21_TYPE_V1'),E.keccak256(descriptor),w.provenance.runtimes.RawBytesValidator.codeHash]));
    await c.sendData('register unknown Type',ti.encodeFunctionData('register',[descriptor,validator]),registry);
    await c.write('storeRecord',[unknown,'0x616263']);
    const result=await c.record(c.recordId(unknown,'0x616263'));
    assert.equal(result.value.body,'0x616263');assert.throws(()=>c.decodePayload(unknown,result.value.body),/Unknown Type/);
    return {};
  });
});
