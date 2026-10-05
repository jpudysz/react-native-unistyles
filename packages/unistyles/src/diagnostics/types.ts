export type VerifyMismatch = {
    tag: number
    component: string
    styleKey: string
    prop: string
    expected: string
    actual: string
}

export type VerifyReport = {
    // all nodes linked with Unistyles
    linked: number
    // nodes compared with the committed shadow tree
    checked: number
    // linked nodes that are not part of the committed shadow tree
    detached: number
    // nodes hidden by Suspense or frozen screens
    suspended: number
    // nodes unmounted without unlink, waiting for the sweep
    orphans: number
    // shadow tree updates that were not committed yet
    pendingUpdates: number
    mismatches: Array<VerifyMismatch>
    errors: Array<string>
}
