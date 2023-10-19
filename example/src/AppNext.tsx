import React from 'react'
import { Unistyles } from 'react-native-unistyles'
import * as Examples from './examples'

// Static helpers allows you to skip writing module declare
Unistyles.Static.registerBreakpoints({
    xs: 0,
    lg: 800,
    sm: 300,
    md: 500,
    xl: 1200
})

// it also skips sorting breakpoints O(n log(n)) complexity

export const App: React.FunctionComponent = () => (
    <Examples.Next />
)
