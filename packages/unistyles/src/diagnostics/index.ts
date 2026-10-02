import type { VerifyReport } from './types'

export type { VerifyMismatch, VerifyReport } from './types'

export const verify = (): VerifyReport => ({
    linked: 0,
    checked: 0,
    detached: 0,
    suspended: 0,
    orphans: 0,
    pendingUpdates: 0,
    mismatches: [],
    errors: [],
})
