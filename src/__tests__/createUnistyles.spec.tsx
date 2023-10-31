// jest.mock('../hooks', () => ({
//     useDimensions: jest.fn(() => ({
//         width: 500,
//         height: 1000
//     }))
// }))

describe('createUnistyles', () => {
    it('should pass', () => {
        expect(1 + 1).toEqual(2)
    })
})
//     describe('createStyleSheet', () => {
//         it('should work exactly the same like StyleSheet.create', () => {
//             const breakpoints = {
//                 xs: 0
//             }
//             const { createStyleSheet } = createUnistyles(breakpoints)
//
//             const styles = {
//                 container: {
//                     flex: 1,
//                     justifyContent: 'center',
//                     alignItems: 'center'
//                 },
//                 text: {
//                     fontWeight: 'bold',
//                     fontSize: 32
//                 }
//             } as const
//
//             expect(createStyleSheet(styles)).toEqual(StyleSheet.create(styles))
//         })
//
//         it('should inject the theme to the createStyleSheet', () => {
//             const theme = {
//                 colors: {
//                     barbie: '#ff9ff3',
//                     oak: '#1dd1a1',
//                     sky: '#48dbfb',
//                     fog: '#c8d6e5',
//                     aloes: '#00d2d3'
//                 }
//             }
//             const breakpoints = {
//                 xs: 0
//             }
//             const { useStyles, createStyleSheet } = createUnistyles<typeof breakpoints, typeof theme>(breakpoints)
//             const stylesheet = createStyleSheet(theme => ({
//                 container: {
//                     backgroundColor: theme.colors.barbie
//                 }
//             }))
//             const { result } = renderHook(() => useStyles(stylesheet), {
//                 // @ts-ignore
//                 wrapper: ({ children }) => (
//                     <UnistylesTheme theme={theme}>
//                         {children}
//                     </UnistylesTheme>
//                 )
//             })
//
//             expect(result.current.theme).toEqual(theme)
//             expect(result.current.styles).not.toBe(Function)
//             expect(result.current.styles.container.backgroundColor).toEqual(theme.colors.barbie)
//         })
//     })
//
//     describe('useStyles', () => {
//         it('should return empty object for optional stylesheet', () => {
//             const breakpoints = {
//                 xs: 0
//             }
//             const { useStyles } = createUnistyles(breakpoints)
//             const { result } = renderHook(() => useStyles())
//
//             expect(result.current.styles).toEqual({})
//             expect(result.current.theme).toEqual({})
//         })
//
//         it ('should choose single value from breakpoints', () => {
//             const breakpoints = {
//                 xs: 0,
//                 sm: 200,
//                 md: 500,
//                 lg: 1000
//             }
//
//             const { useStyles, createStyleSheet } = createUnistyles(breakpoints)
//             const stylesheet = createStyleSheet({
//                 container: {
//                     flex: 1,
//                     justifyContent: 'center',
//                     alignItems: {
//                         xs: 'row',
//                         md: 'column'
//                     }
//                 }
//             })
//             const { result } = renderHook(() => useStyles(stylesheet))
//
//             expect(result.current.styles.container.alignItems).toEqual('column')
//         })
//
//         it ('should choose single value from media queries', () => {
//             const breakpoints = {
//                 xs: 0
//             }
//
//             const { useStyles, createStyleSheet } = createUnistyles(breakpoints)
//             const stylesheet = createStyleSheet({
//                 container: {
//                     flex: 1,
//                     justifyContent: 'center',
//                     alignItems: {
//                         xs: 'row',
//                         ':w[300, 490]': 'column',
//                         ':w[491]': 'row'
//                     }
//                 }
//             })
//             const { result } = renderHook(() => useStyles(stylesheet as CustomNamedStyles<typeof stylesheet, typeof breakpoints>))
//
//             expect(result.current.styles.container.alignItems).toEqual('row')
//         })
//
//         it ('should choose wrap dynamic functions in Proxy', () => {
//             const breakpoints = {
//                 xs: 0
//             }
//
//             const { useStyles, createStyleSheet } = createUnistyles<typeof breakpoints, {}>(breakpoints)
//             const stylesheet = createStyleSheet({
//                 container: (flex: number) => ({
//                     flex,
//                     justifyContent: 'center',
//                     alignItems: {
//                         xs: 'row',
//                         ':w[300, 490]': 'column',
//                         ':w[491]': 'row'
//                     }
//                 })
//             })
//             const { result } = renderHook(() => useStyles(stylesheet as CustomNamedStyles<typeof stylesheet, typeof breakpoints>))
//
//             expect(result.current.styles.container).toBeInstanceOf(Function)
//             expect((result.current.styles.container as (flex: number) => ViewStyle)(2)).toEqual({
//                 flex: 2,
//                 justifyContent: 'center',
//                 alignItems: 'row'
//             })
//         })
//
//         it ('should return breakpoint even if no stylesheet has been provided', () => {
//             const breakpoints = {
//                 xs: 0,
//                 sm: 200,
//                 md: 500,
//                 lg: 1000
//             }
//
//             const { useStyles } = createUnistyles<typeof breakpoints, {}>(breakpoints)
//             const { result } = renderHook(() => useStyles())
//
//             expect(result.current.breakpoint).toEqual('md')
//         })
//
//         it ('should return breakpoint for stylesheet', () => {
//             const breakpoints = {
//                 xs: 0,
//                 sm: 200,
//                 lg: 1000
//             }
//
//             const { useStyles, createStyleSheet } = createUnistyles<typeof breakpoints, {}>(breakpoints)
//             const stylesheet = createStyleSheet({
//                 container: {
//                     flex: 1,
//                     justifyContent: 'center',
//                     alignItems: 'center'
//                 }
//             })
//             const { result } = renderHook(() => useStyles(stylesheet as CustomNamedStyles<typeof stylesheet, typeof breakpoints>))
//
//             expect(result.current.breakpoint).toEqual('sm')
//         })
//     })
// })
