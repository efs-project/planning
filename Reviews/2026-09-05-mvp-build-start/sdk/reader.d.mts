import type { Config, LabClient } from './lab-only.mjs'
export type ReaderConfig = Pick<Config, 'deployment' | 'readProvider'> & { walletProvider?: never; relayProvider?: never; sessionProvider?: never }
export type LabReader = Pick<LabClient, 'profile' | 'files' | 'records'>
export function createLabReader(config: ReaderConfig): LabReader
