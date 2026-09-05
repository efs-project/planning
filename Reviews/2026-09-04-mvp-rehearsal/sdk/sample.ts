import { asDataHex, createLabSdk, type Address, type Hex, type LabDeployment } from './index.js'

declare const config: LabDeployment & { accounts: { owner: Address; relayer: Address } }
declare const readProvider: { request(args: { method: string; params?: readonly unknown[] }): Promise<unknown> }
declare const walletProvider: typeof readProvider
declare const relayProvider: typeof readProvider

const sdk = createLabSdk({ readProvider, walletProvider, relayProvider, deployment: config })

// Wallet-free planning. A browser may render this preview before asking for the
// one simulated-local wallet signature.
const operation = sdk.operations.createFile({
  target: config.rootId as Hex,
  name: 'hello.txt',
  data: asDataHex('hello from the disposable lab'),
  salt: `0x${'11'.repeat(32)}` as Hex,
  nonce: 0n,
  deadline: BigInt(Math.floor(Date.now() / 1000) + 300),
})
const plan = sdk.planWrite({ operation })
const prepared = await sdk.prepareWrite(plan, { mode: 'relayed', account: config.accounts.owner })
const submitted = await sdk.submitWrite(prepared, { from: config.accounts.relayer })

// Inclusion is progress only. Only this independent state read may report
// effect=COMMITTED.
const recovered = await sdk.readBack(submitted)
if (recovered.stage === 'READ_BACK_VERIFIED') {
  console.log(recovered.effect, recovered.recoveredReceipt)
} else {
  console.log(recovered.comparison, recovered.qualification.authority, recovered.reasonCode)
}
