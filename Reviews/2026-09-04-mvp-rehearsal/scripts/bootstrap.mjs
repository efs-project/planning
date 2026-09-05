import { hexlify, randomBytes, ZeroHash, TypedDataEncoder } from 'ethers';
import { send } from './local-chain.mjs';
import { createLabSdk, deriveSchemaId, encodeTypedPayload, GrantTypes, labDomain } from '../sdk/index.js';
import { gameBytes } from '../web/game-source.mjs';

export async function seedLab(lab) {
  const direct = { request: ({ method, params = [] }) => lab.provider.send(method, params) };
  const sdk = createLabSdk({ deployment: lab.deployment, readProvider: direct, walletProvider: direct, relayProvider: direct, sessionProvider: direct });
  const block = await lab.provider.getBlock('latest');
  const deadline = BigInt(block.timestamp + 3600);
  const operation = async (kind, target, name, data = '0x') => {
    const op = { kind, target, name, schemaId: ZeroHash, data, salt: hexlify(randomBytes(32)), expectedRevision: 0n,
      nonce: await lab.core.ownerNonce(), deadline, grantId: ZeroHash };
    const plan = sdk.planWrite({ operation: op });
    await send(lab.core.executeDirect, op);
    return plan.predicted;
  };
  const welcome = await operation(2, lab.deployment.rootId, 'welcome.md', hexlify(new TextEncoder().encode(
    '# EFS MVP rehearsal\n\nThese bytes were stored by a real local Solidity contract.\n\nCreate a folder, save a file, revise it, and reopen this page. The reader checks the exact bytes after every save.\n\nThe Data tab reads typed records. Arcade verifies a small game before launching it.\n',
  )));
  const notes = await operation(1, lab.deployment.rootId, 'Notes');
  await operation(2, notes.resultId, 'design.txt', hexlify(new TextEncoder().encode('One atomic Core, a separate byte carrier, and a reader that checks what was saved.')));
  const game = await operation(2, lab.deployment.rootId, 'signal-drift.html', hexlify(gameBytes()));
  const recordSeeds = [
    { descriptor: '0x0402', values: ['Notes are ordinary typed data', true], label: 'Note' },
    { descriptor: '0x0401', values: ['Signal Drift sample', 42n], label: 'Score observation' },
  ];
  const labels = {};
  for (const seed of recordSeeds) {
    await send(lab.core.registerSchema, seed.descriptor);
    const schemaId = deriveSchemaId(seed.descriptor);
    const op = sdk.operations.publishRecord({ schemaId, data: encodeTypedPayload(seed.descriptor, seed.values),
      nonce: await lab.core.ownerNonce(), deadline });
    const predicted = sdk.planWrite({ operation: op }).predicted;
    await send(lab.core.executeDirect, op);
    labels[predicted.resultId] = seed.label;
  }
  const session = await lab.session.getAddress();
  const grant = { key: session, scope: lab.deployment.rootId, operations: 7, expiry: deadline, maxWrites: 8,
    maxBytes: 32768n, nonce: 0n };
  const grantId = TypedDataEncoder.hash(labDomain(lab.deployment), GrantTypes, grant);
  return {
    deployment: lab.deployment,
    accounts: { owner: await lab.owner.getAddress(), relayer: await lab.relay.getAddress(), session },
    sessionGrant: { grant, grantId, registered: false },
    game: { fileId: game.resultId, revision: 1, contentId: game.contentId },
    welcome: { fileId: welcome.resultId, contentId: welcome.contentId },
    labels, lab: true, walletMode: 'LOCAL_EIP1193_SIMULATION',
  };
}
