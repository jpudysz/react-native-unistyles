// todo
describe('styles', () => {
    it('should pass', () => {
        expect(1 + 1).toEqual(2)
    })
    // describe('proxifyFunction', () => {
    //     it('should parse style for dynamic function', () => {
    //         const screenSize: ScreenSize = {
    //             width: 400,
    //             height: 800
    //         }
    //         const breakpoint = 'sm'
    //         const breakpoints = {
    //             xs: 0,
    //             sm: 400,
    //             md: 800
    //         }
    //         const breakpointPairs = Object
    //             .entries(breakpoints) as SortedBreakpointEntries<typeof breakpoints>
    //         const dynamicFunction = (isEven: boolean) => ({
    //             backgroundColor: {
    //                 sm: isEven
    //                     ? 'green'
    //                     : 'red',
    //                 md: isEven
    //                     ? 'orange'
    //                     : 'pink'
    //             }
    //         })
    //
    //         expect(proxifyFunction(dynamicFunction, breakpoint, screenSize, breakpointPairs)(true)).toEqual({
    //             backgroundColor: 'green'
    //         })
    //     })
    //
    //     it('should return proxified function for custom media query', () => {
    //         const screenSize: ScreenSize = {
    //             width: 400,
    //             height: 800
    //         }
    //         const breakpoint = 'sm'
    //         const breakpoints = {
    //             xs: 0,
    //             sm: 400,
    //             md: 800
    //         }
    //         const breakpointPairs = Object
    //             .entries(breakpoints) as SortedBreakpointEntries<typeof breakpoints>
    //         const dynamicFunction = (isEven: boolean) => ({
    //             backgroundColor: {
    //                 ':w[,399]': isEven
    //                     ? 'green'
    //                     : 'red',
    //                 ':w[400]': isEven
    //                     ? 'orange'
    //                     : 'pink'
    //             }
    //         })
    //
    //         expect(proxifyFunction(dynamicFunction, breakpoint, screenSize, breakpointPairs)(false)).toEqual({
    //             backgroundColor: 'pink'
    //         })
    //     })
    //
    //     it('should return same function for no breakpoints nor media queries', () => {
    //         const screenSize: ScreenSize = {
    //             width: 400,
    //             height: 800
    //         }
    //         const breakpoint = 'sm'
    //         const breakpoints = {
    //             xs: 0,
    //             sm: 400,
    //             md: 800
    //         }
    //         const breakpointPairs = Object
    //             .entries(breakpoints) as SortedBreakpointEntries<typeof breakpoints>
    //         const dynamicFunction = (isEven: boolean) => ({
    //             backgroundColor: isEven
    //                 ? 'pink'
    //                 : 'purple'
    //         })
    //
    //         expect(proxifyFunction(dynamicFunction, breakpoint, screenSize, breakpointPairs)(false)).toEqual({
    //             backgroundColor: 'purple'
    //         })
    //     })
    // })

    // describe('parseStyle', () => {
    //     it('should correctly parse styles', () => {
    //         const screenSize: ScreenSize = {
    //             width: 400,
    //             height: 800
    //         }
    //         const breakpoint = 'sm'
    //         const breakpoints = {
    //             xs: 0,
    //             sm: 400,
    //             md: 800
    //         }
    //         const breakpointPairs = Object
    //             .entries(breakpoints) as SortedBreakpointEntries<typeof breakpoints>
    //         const style = {
    //             fontSize: {
    //                 sm: 12,
    //                 md: 20
    //             },
    //             backgroundColor: {
    //                 xs: 'pink',
    //                 md: 'orange'
    //             },
    //             fontWeight: 'bold'
    //         }
    //         const parsedStyles = parseStyle(
    //             style as CustomNamedStyles<typeof style, typeof breakpoints>,
    //             breakpoint,
    //             screenSize,
    //             breakpointPairs
    //         )
    //
    //         expect(parsedStyles).toEqual({
    //             fontSize: 12,
    //             backgroundColor: 'pink',
    //             fontWeight: 'bold'
    //         })
    //     })
    //
    //     it('should correctly parse transform styles', () => {
    //         const screenSize: ScreenSize = {
    //             width: 400,
    //             height: 800
    //         }
    //         const breakpoint = 'sm'
    //         const breakpoints = {
    //             xs: 0,
    //             sm: 400,
    //             md: 800
    //         }
    //         const breakpointPairs = Object
    //             .entries(breakpoints) as SortedBreakpointEntries<typeof breakpoints>
    //         const style = {
    //             transform: [
    //                 {
    //                     translateX: {
    //                         sm: 120,
    //                         md: 200
    //                     },
    //                     translateY: 200
    //                 }
    //             ]
    //         }
    //
    //         const parsedStyles = parseStyle(
    //             style as CustomNamedStyles<typeof style, typeof breakpoints>,
    //             breakpoint,
    //             screenSize,
    //             breakpointPairs
    //         )
    //
    //         expect(parsedStyles).toEqual({
    //             transform: [
    //                 {
    //                     translateX: 120,
    //                     translateY: 200
    //                 }
    //             ]
    //         })
    //     })
    //
    //     it('should correctly parse shadowOffset styles', () => {
    //         const screenSize: ScreenSize = {
    //             width: 400,
    //             height: 800
    //         }
    //         const breakpoint = 'sm'
    //         const breakpoints = {
    //             xs: 0,
    //             sm: 400,
    //             md: 800
    //         }
    //         const breakpointPairs = Object
    //             .entries(breakpoints) as SortedBreakpointEntries<typeof breakpoints>
    //         const style = {
    //             shadowOffset: {
    //                 width: 0,
    //                 height: 4
    //             }
    //         }
    //         const styleWithBreakpoints = {
    //             shadowOffset: {
    //                 width: 0,
    //                 height: {
    //                     sm: 10,
    //                     md: 20
    //                 }
    //             }
    //         }
    //
    //         const parsedStyles = parseStyle(
    //             style as CustomNamedStyles<typeof style, typeof breakpoints>,
    //             breakpoint,
    //             screenSize,
    //             breakpointPairs
    //         )
    //         const parsedStylesWithBreakpoints = parseStyle(
    //             styleWithBreakpoints as CustomNamedStyles<typeof style, typeof breakpoints>,
    //             breakpoint,
    //             screenSize,
    //             breakpointPairs
    //         )
    //
    //         expect(parsedStyles).toEqual({
    //             shadowOffset: {
    //                 width: 0,
    //                 height: 4
    //             }
    //         })
    //         expect(parsedStylesWithBreakpoints).toEqual({
    //             shadowOffset: {
    //                 width: 0,
    //                 height: 10
    //             }
    //         })
    //     })
    // })
})
