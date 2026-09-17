/** Public source snapshots independently fetched 2026-09-16 through HTTPS.
 * These are authored payload fingerprints, not AR or IPFS protocol proofs.
 * No startup network request or executable content is needed to register them.
 * Sources: https://github.com/ArweaveTeam/arweave-js/blob/master/README.md
 * https://docs.ipfs.tech/how-to/address-ipfs-on-web/ */
// Replaceable HTTPS transport observed 2026-09-17, not a hosting guarantee.
// ipfs.io/dweb.link share retiring infrastructure; do not treat them as redundancy.
export const externalGateways={ar:['https://arweave.net/'],ipfs:['https://gateway.pinata.cloud/ipfs/']};
export const publicExternalSamples=[
  {name:'arweave-public.bin',locator:'ar://hKMMPNh_emBf8v_at1tFzNYACisyMQNcKzeeE1QE9p8',length:36795,digest:'1d8f6fb7e9a8cab36eb208493f5a6fa96b300fc5a513c7ca5ef6bf5c3bbe6cdb',carrier:2},
  {name:'ipfs-public.bin',locator:'ipfs://bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly',length:12435,digest:'ce70365436aa32ae74cec485316fa415c5867d01729848791d9f70078e3d3a3a',carrier:3},
];
export function externalSampleDescriptor(sample){
  return {inline:'0'.repeat(64),version:2,carrier:sample.carrier,algorithm:1,length:sample.length,digest:sample.digest,media:0,encryption:0,nonce:'0'.repeat(24),plainLength:sample.length,plainDigest:sample.digest,locator:sample.locator};
}
