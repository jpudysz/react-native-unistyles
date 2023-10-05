import { parseStyle, proxifyFunction } from './styles'
import type { CustomNamedStyles, ScreenSize } from '../types'

describe('styles', () => {
    describe('proxifyFunction', () => {
        it('should parse style for dynamic function', () => {
            const screenSize: ScreenSize = {
                width: 400,
                height: 800
            }
            const breakpoint = 'sm'
            const breakpoints = {
                xs: 0,
                sm: 400,
                md: 800
            }
            const dynamicFunction = (isEven: boolean) => ({
                backgroundColor: {
                    sm: isEven
                        ? 'green'
                        : 'red',
                    md: isEven
                        ? 'orange'
                        : 'pink'
                }
            })

            expect(proxifyFunction(dynamicFunction, breakpoint, screenSize, breakpoints)(true)).toEqual({
                backgroundColor: 'green'
            })
        })

        it('should return proxified function for custom media query', () => {
            const screenSize: ScreenSize = {
                width: 400,
                height: 800
            }
            const breakpoint = 'sm'
            const breakpoints = {
                xs: 0,
                sm: 400,
                md: 800
            }
            const dynamicFunction = (isEven: boolean) => ({
                backgroundColor: {
                    ':w[,399]': isEven
                        ? 'green'
                        : 'red',
                    ':w[400]': isEven
                        ? 'orange'
                        : 'pink'
                }
            })

            expect(proxifyFunction(dynamicFunction, breakpoint, screenSize, breakpoints)(false)).toEqual({
                backgroundColor: 'pink'
            })
        })

        it('should return same function for no breakpoints nor media queries', () => {
            const screenSize: ScreenSize = {
                width: 400,
                height: 800
            }
            const breakpoint = 'sm'
            const breakpoints = {
                xs: 0,
                sm: 400,
                md: 800
            }
            const dynamicFunction = (isEven: boolean) => ({
                backgroundColor: isEven
                    ? 'pink'
                    : 'purple'
            })

            expect(proxifyFunction(dynamicFunction, breakpoint, screenSize, breakpoints)(false)).toEqual({
                backgroundColor: 'purple'
            })
        })
    })

    describe('parseStyle', () => {
        it('should correctly parse styles', () => {
            const screenSize: ScreenSize = {
                width: 400,
                height: 800
            }
            const breakpoint = 'sm'
            const breakpoints = {
                xs: 0,
                sm: 400,
                md: 800
            }
            const style = {
                fontSize: {
                    sm: 12,
                    md: 20
                },
                backgroundColor: {
                    xs: 'pink',
                    md: 'orange'
                },
                fontWeight: 'bold'
            }

            expect(parseStyle(style as CustomNamedStyles<typeof style, typeof breakpoints>, breakpoint, screenSize, breakpoints)).toEqual({
                fontSize: 12,
                backgroundColor: 'pink',
                fontWeight: 'bold'
            })
        })

        it('should correctly parse transform styles', () => {
            const screenSize: ScreenSize = {
                width: 400,
                height: 800
            }
            const breakpoint = 'sm'
            const breakpoints = {
                xs: 0,
                sm: 400,
                md: 800
            }
            const style = {
                transform: [
                    {
                        translateX: {
                            sm: 120,
                            md: 200
                        },
                        translateY: 200
                    }
                ]
            }

            expect(parseStyle(style as CustomNamedStyles<typeof style, typeof breakpoints>, breakpoint, screenSize, breakpoints)).toEqual({
                transform: [
                    {
                        translateX: 120,
                        translateY: 200
                    }
                ]
            })
        })

        it('should correctly parse shadowOffset styles', () => {
            const screenSize: ScreenSize = {
                width: 400,
                height: 800
            }
            const breakpoint = 'sm'
            const breakpoints = {
                xs: 0,
                sm: 400,
                md: 800
            }
            const style = {
                shadowOffset: {
                    width: 0,
                    height: 4
                }
            }
            const styleWithBreakpoints = {
                shadowOffset: {
                    width: 0,
                    height: {
                        sm: 10,
                        md: 20
                    }
                }
            }

            expect(parseStyle(style as CustomNamedStyles<typeof style, typeof breakpoints>, breakpoint, screenSize, breakpoints)).toEqual({
                shadowOffset: {
                    width: 0,
                    height: 4
                }
            })
            expect(parseStyle(styleWithBreakpoints as CustomNamedStyles<typeof style, typeof breakpoints>, breakpoint, screenSize, breakpoints)).toEqual({
                shadowOffset: {
                    width: 0,
                    height: 10
                }
            })
        })
    })
})
