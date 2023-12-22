import type { StyleSheet } from '../types'
import { mq, parseStyle, proxifyFunction, isPlatformColor } from '../utils'
import { mockRegistry, mockRuntime } from './mocks'

jest.mock('../core', () => {
    class MockedUnistyles {
        registry = {
            plugins: []
        }
        runtime = {}
    }

    return {
        unistyles: new MockedUnistyles()
    }
})

jest.mock('../common', () => ({
    isIOS: false,
    isAndroid: false
}))

describe('styles', () => {
    describe('proxifyFunction', () => {
        afterEach(() => {
            jest.restoreAllMocks()
        })

        it('should parse style for dynamic function', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })
            unistyles.registry = mockRegistry()
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

            const result = proxifyFunction(
                'container',
                dynamicFunction,
                {}
            )(true)

            expect(result).toEqual({
                backgroundColor: 'green'
            })
        })

        it('should return proxified function for custom media query', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

            const dynamicFunction = (isEven: boolean) => ({
                backgroundColor: {
                    [mq.only.width(null, 399)]: isEven
                        ? 'green'
                        : 'red',
                    [mq.only.width(400)]: isEven
                        ? 'orange'
                        : 'pink'
                }
            })
            const result = proxifyFunction(
                'container',
                dynamicFunction,
                {}
            )(false)

            expect(result).toEqual({
                backgroundColor: 'pink'
            })
        })

        it('should return same function for no breakpoints nor media queries', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

            const dynamicFunction = (isEven: boolean) => ({
                backgroundColor: isEven
                    ? 'pink'
                    : 'purple'
            })
            const result = proxifyFunction(
                'container',
                dynamicFunction,
                {}
            )(false)

            expect(result).toEqual({
                backgroundColor: 'purple'
            })
        })
    })

    describe('parseStyle', () => {
        it('should correctly parse styles', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

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
            const parsedStyles = parseStyle(
                style as StyleSheet,
                {}
            )

            expect(parsedStyles).toEqual({
                fontSize: 12,
                backgroundColor: 'pink',
                fontWeight: 'bold'
            })
        })

        it('should correctly parse transform styles', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

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

            const parsedStyles = parseStyle(
                style as StyleSheet,
                {}
            )

            expect(parsedStyles).toEqual({
                transform: [
                    {
                        translateX: 120,
                        translateY: 200
                    }
                ]
            })
        })

        it('should correctly parse shadowOffset styles', () => {
            const { unistyles } = require('../core')

            unistyles.runtime = mockRuntime({
                width: 400,
                height: 800
            })

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
            const parsedStyles = parseStyle(
                style as StyleSheet,
                {}
            )
            const parsedStylesWithBreakpoints = parseStyle(
                styleWithBreakpoints as StyleSheet,
                {}
            )

            expect(parsedStyles).toEqual({
                shadowOffset: {
                    width: 0,
                    height: 4
                }
            })
            expect(parsedStylesWithBreakpoints).toEqual({
                shadowOffset: {
                    width: 0,
                    height: 10
                }
            })
        })

        it('should not parse styles if parseMediaQueries flag is falsy', () => {
            const style = {
                backgroundColor: {
                    sm: 'pink',
                    md: 'orange'
                }
            }

            const parsedStyles = parseStyle(
                style as StyleSheet,
                {},
                false
            )

            expect(parsedStyles).toEqual({
                backgroundColor: {
                    sm: 'pink',
                    md: 'orange'
                }
            })
        })
    })

    describe('platformColors', () => {
        it('should detect if given object is android PlatformColor', () => {
            jest.requireMock('../common').isAndroid = true

            const obj1 = {}
            const obj2 = {
                android: 'red'
            }
            const obj3 = {
                semantic: true
            }
            const obj4 = {
                semantic: {}
            }
            const obj5 = {
                // eslint-disable-next-line camelcase
                resource_paths: true
            }
            const obj6 = {
                // eslint-disable-next-line camelcase
                resource_paths: {}
            }

            expect(isPlatformColor(obj1)).toBe(false)
            expect(isPlatformColor(obj2)).toBe(false)
            expect(isPlatformColor(obj3)).toBe(false)
            expect(isPlatformColor(obj4)).toBe(false)
            expect(isPlatformColor(obj5)).toBe(false)
            expect(isPlatformColor(obj6)).toBe(true)
        })

        it('should detect if given object is ios PlatformColor', () => {
            jest.requireMock('../common').isIOS = true

            const obj1 = {}
            const obj2 = {
                ios: 'red'
            }
            const obj3 = {
                semantic: true
            }
            const obj4 = {
                semantic: {}
            }
            const obj5 = {
                // eslint-disable-next-line camelcase
                resource_paths: true
            }
            const obj6 = {
                // eslint-disable-next-line camelcase
                resource_paths: {}
            }

            expect(isPlatformColor(obj1)).toBe(false)
            expect(isPlatformColor(obj2)).toBe(false)
            expect(isPlatformColor(obj3)).toBe(false)
            expect(isPlatformColor(obj4)).toBe(true)
            expect(isPlatformColor(obj5)).toBe(false)
            expect(isPlatformColor(obj6)).toBe(false)
        })
    })

    describe('variants', () => {
        it ('should return correct variants from style', () => {
            const style = {
                flex: 1,
                variants: {
                    color: {
                        green: {
                            backgroundColor: 'green'
                        },
                        blue: {
                            backgroundColor: 'blue'
                        }
                    }
                }
            }

            const parsedStyles = parseStyle(
                style as StyleSheet,
                {
                    color: 'blue'
                },
                false
            )

            expect(parsedStyles).toEqual({
                flex: 1,
                backgroundColor: 'blue'
            })
        })

        it ('should do nothing for invalid variant', () => {
            const style = {
                flex: 1,
                variants: {
                    color: {
                        green: {
                            backgroundColor: 'green'
                        },
                        blue: {
                            backgroundColor: 'blue'
                        }
                    }
                }
            }

            const parsedStyles = parseStyle(
                style as StyleSheet,
                {
                    color: 'pink',
                    otherVariant: 'md'
                },
                false
            )

            expect(parsedStyles).toEqual({
                flex: 1
            })
        })

        it ('should return default variant if there is any', () => {
            const style = {
                flex: 1,
                variants: {
                    color: {
                        green: {
                            backgroundColor: 'green'
                        },
                        blue: {
                            backgroundColor: 'blue'
                        },
                        default: {
                            backgroundColor: 'pink'
                        }
                    }
                }
            }

            const parsedStyles = parseStyle(
                style as StyleSheet,
                undefined,
                false
            )

            expect(parsedStyles).toEqual({
                flex: 1,
                backgroundColor: 'pink'
            })
        })
    })
})
