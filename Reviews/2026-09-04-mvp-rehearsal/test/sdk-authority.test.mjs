import assert from 'node:assert/strict'
import test from 'node:test'
import { Interface, hexlify, randomBytes } from 'ethers'
import { createLabSdk } from '../sdk/index.js'
import { TX_GAS, withLabChain } from '../scripts/local-chain.mjs'

function rpc(lab) {
  return {
    request({ method, params = [] }) {
      const actual = method === 'eth_sendTransaction' ? [{ ...params[0], gas: `0x${TX_GAS.toString(16)}` }] : params
      return lab.provider.send(method, actual)
    },
  }
}

test('canonical read-back success requires recovered admission authority', { timeout: 120000 }, async () => {
  await withLabChain(async (lab) => {
    const transport = rpc(lab)
    const sdk = createLabSdk({
      deployment: lab.deployment,
      readProvider: transport,
      walletProvider: transport,
      relayProvider: transport,
    })
    const owner = await lab.owner.getAddress()
    const relay = await lab.relay.getAddress()
    const stranger = await lab.stranger.getAddress()
    const deadline = BigInt((await lab.provider.getBlock('latest')).timestamp) + 600n

    const directOperation = sdk.operations.mkdir({
      target: lab.deployment.rootId,
      name: 'direct-authority',
      salt: hexlify(randomBytes(32)),
      nonce: await lab.core.ownerNonce(),
      deadline,
    })
    const directPrepared = await sdk.prepareWrite(sdk.planWrite({ operation: directOperation }), { mode: 'direct', account: owner })
    const directSubmitted = await sdk.submitWrite(directPrepared)
    const noTransactionProvider = {
      request(request) {
        if (request.method === 'eth_getTransactionByHash') return null
        return transport.request(request)
      },
    }
    const directRecovered = await createLabSdk({ deployment: lab.deployment, readProvider: noTransactionProvider }).readBack(directSubmitted)
    assert.equal(directRecovered.qualification.authority, 'UNKNOWN')
    assert.notEqual(directRecovered.stage, 'READ_BACK_VERIFIED')
    assert.equal(directRecovered.effect, 'UNKNOWN')

    const relayedOperation = sdk.operations.mkdir({
      target: lab.deployment.rootId,
      name: 'relayed-authority',
      salt: hexlify(randomBytes(32)),
      nonce: await lab.core.ownerNonce(),
      deadline,
    })
    const relayedPrepared = await sdk.prepareWrite(sdk.planWrite({ operation: relayedOperation }), { mode: 'relayed', account: owner })
    const relayedSubmitted = await sdk.submitWrite(relayedPrepared, { from: relay })
    const core = new Interface(lab.deployment.coreAbi)
    const receiptSelector = core.getFunction('receipt').selector
    const contradictoryProvider = {
      async request(request) {
        const raw = await transport.request(request)
        if (request.method !== 'eth_call' || !request.params[0].data.startsWith(receiptSelector)) return raw
        const receipt = core.decodeFunctionResult('receipt', raw)[0]
        return core.encodeFunctionResult('receipt', [{
          operationBytes: receipt.operationBytes,
          witness: receipt.witness,
          mode: receipt.mode,
          signer: stranger,
          resultId: receipt.resultId,
          revision: receipt.revision,
          blockNumber: receipt.blockNumber,
          timestamp: receipt.timestamp,
          digest: receipt.digest,
        }])
      },
    }
    const relayedRecovered = await createLabSdk({ deployment: lab.deployment, readProvider: contradictoryProvider }).readBack(relayedSubmitted)
    assert.notEqual(relayedRecovered.qualification.authority, 'AUTHORIZED_AT_BASIS')
    assert.notEqual(relayedRecovered.stage, 'READ_BACK_VERIFIED')
    assert.equal(relayedRecovered.effect, 'UNKNOWN')
  })
})
