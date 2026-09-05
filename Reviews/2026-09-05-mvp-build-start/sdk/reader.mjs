import { createLabClient } from './lab-only.mjs'
export function createLabReader(config) {
  if (config && ['walletProvider', 'relayProvider', 'sessionProvider'].some(key => key in config)) throw new TypeError('reader config cannot contain signing or submission providers')
  const { profile, files, records } = createLabClient(config)
  return Object.freeze({ profile, files, records })
}
