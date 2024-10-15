import React from 'react'

export * from './specs'
export { mq } from './mq'
export type { UnistylesThemes, UnistylesBreakpoints } from './global'
// TODO: export Native createUnistylesComponent
// can't import it this way, it will break native build
// export { createUnistylesComponent } from './web/createUnistylesComponent'

// todo verify true min version
const minReactVersionRequiredByUnistyles = '18.3.1'

if (React.version < minReactVersionRequiredByUnistyles) {
    throw new Error(`
        You are using an outdated version of React (${React.version}).
        Unistyles requires at least React ${minReactVersionRequiredByUnistyles}.
    `)
}
