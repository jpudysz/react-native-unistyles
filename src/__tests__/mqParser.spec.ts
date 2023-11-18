import { getKeyForUnistylesMediaQuery, isValidMq, isWithinTheWidthAndHeight, mq, parseMq } from '../utils'
import type { NestedStylePairs } from '../types'

jest.mock('../core', () => ({
    unistyles: {}
}))

describe('mqParser', () => {
    describe('getKeyForUnistylesMediaQuery', () => {
        it('should return key for matching media query', () => {
            const mediaQueries = Object.entries({
                [mq.width(100, 300)]: 'green',
                [mq.width(300, 500)]: 'blue',
                [mq.height(500, 700)]: 'red'
            }) as NestedStylePairs

            const screenSize = {
                width: 400,
                height: 600
            }

            expect(getKeyForUnistylesMediaQuery(mediaQueries, screenSize)).toBe(':w[300, 500]')
        })

        it('should return undefined for invalid media queries', () => {
            const mediaQueries = Object.entries({
                'media-query(100-200)': 'green',
                ':w[ , 400]': 'blue',
                'width[200, 400]': 'red',
                ':w[Infinity, 400]': 'pink'
            }) as NestedStylePairs

            const screenSize = {
                width: 400,
                height: 600
            }

            expect(getKeyForUnistylesMediaQuery(mediaQueries, screenSize)).toBe(undefined)
        })

        it('should return undefined for invalid media queries after parsing', () => {
            const mediaQueries = Object.entries({
                ':w[200, 100]': 'green',
                ':w[Infinity, 10000]': 'blue',
                ':w[0, -1]': 'red',
                ':h[-100, 800]:w[200, 300]': 'pink'
            }) as NestedStylePairs

            const screenSize = {
                width: 400,
                height: 600
            }

            expect(getKeyForUnistylesMediaQuery(mediaQueries, screenSize)).toBe(undefined)
        })
    })

    describe('isWithinTheWidthAndHeight', () => {
        it('should return true if the height is within the range', () => {
            const parsedMq = {
                height: {
                    from: 100,
                    to: 300
                },
                width: undefined
            }
            const screenSize = {
                width: 400,
                height: 200
            }

            expect(isWithinTheWidthAndHeight(parsedMq, screenSize)).toBe(true)
        })

        it('should return false if the height is not within the range', () => {
            const parsedMq = {
                height: {
                    from: 100,
                    to: 300
                },
                width: undefined
            }
            const screenSize = {
                width: 400,
                height: 400
            }

            expect(isWithinTheWidthAndHeight(parsedMq, screenSize)).toBe(false)
        })

        it('should return true if the width is within the range', () => {
            const parsedMq = {
                height: undefined,
                width: {
                    from: 100,
                    to: 300
                }
            }
            const screenSize = {
                width: 200,
                height: 400
            }

            expect(isWithinTheWidthAndHeight(parsedMq, screenSize)).toBe(true)
        })

        it('should return false if the width is not within the range', () => {
            const parsedMq = {
                height: undefined,
                width: {
                    from: 100,
                    to: 300
                }
            }
            const screenSize = {
                width: 400,
                height: 400
            }

            expect(isWithinTheWidthAndHeight(parsedMq, screenSize)).toBe(false)
        })

        it('should return true if the width and height are within the range', () => {
            const parsedMq = {
                height: {
                    from: 100,
                    to: 300
                },
                width: {
                    from: 100,
                    to: 300
                }
            }
            const screenSize = {
                width: 200,
                height: 200
            }

            expect(isWithinTheWidthAndHeight(parsedMq, screenSize)).toBe(true)
        })

        it('should return false if the width and height are not within the range', () => {
            const parsedMq = {
                height: {
                    from: 100,
                    to: 300
                },
                width: {
                    from: 100,
                    to: 300
                }
            }
            const screenSize = {
                width: 400,
                height: 400
            }

            expect(isWithinTheWidthAndHeight(parsedMq, screenSize)).toBe(false)
        })

        it('should return false for no width and height', () => {
            const parsedMq = {
                height: undefined,
                width: undefined
            }
            const screenSize = {
                width: 400,
                height: 400
            }

            expect(isWithinTheWidthAndHeight(parsedMq, screenSize)).toBe(false)
        })
    })

    describe('isValidMq', () => {
        it('should return true for valid media queries', () => {
            const parsedMq1 = {
                height: {
                    from: 100,
                    to: 300
                },
                width: {
                    from: 100,
                    to: 300
                }
            }
            const parsedMq2 = {
                height: {
                    from: 100,
                    to: 300
                },
                width: undefined
            }
            const parsedMq3 = {
                height: undefined,
                width: {
                    from: 100,
                    to: 300
                }
            }

            expect(isValidMq(parsedMq1)).toBe(true)
            expect(isValidMq(parsedMq2)).toBe(true)
            expect(isValidMq(parsedMq3)).toBe(true)
        })

        it('should return false for invalid media queries', () => {
            const parsedMq1 = {
                widthAndHeight: {
                    from: 100,
                    to: 300
                },
                height: undefined
            }
            const parsedMq2 = {
                minHeight: {
                    from: 100,
                    to: 300
                },
                width: undefined
            }

            expect(isValidMq(parsedMq1)).toBe(false)
            expect(isValidMq(parsedMq2)).toBe(false)
        })
    })

    describe('parseMq', () => {
        it('should correctly parse unistyles media query', () => {
            const mediaQueries = [
                ':w[100, 300]',
                ':w[0, 500]',
                ':w[100, Infinity]',
                ':h[20, 800]',
                ':h[0, Infinity]',
                ':w[100, 300]:h[20, 800]',
                ':w[0, 500]:h[0, Infinity]',
                ':w[100, Infinity]:h[0, Infinity]'
            ]
            const results = [
                {
                    width: {
                        from: 100,
                        to: 300
                    },
                    height: undefined
                },
                {
                    width: {
                        from: 0,
                        to: 500
                    },
                    height: undefined
                },
                {
                    width: {
                        from: 100,
                        to: Infinity
                    },
                    height: undefined
                },
                {
                    width: undefined,
                    height: {
                        from: 20,
                        to: 800
                    }
                },
                {
                    width: undefined,
                    height: {
                        from: 0,
                        to: Infinity
                    }
                },
                {
                    width: {
                        from: 100,
                        to: 300
                    },
                    height: {
                        from: 20,
                        to: 800
                    }
                },
                {
                    width: {
                        from: 0,
                        to: 500
                    },
                    height: {
                        from: 0,
                        to: Infinity
                    }
                },
                {
                    width: {
                        from: 100,
                        to: Infinity
                    },
                    height: {
                        from: 0,
                        to: Infinity
                    }
                }
            ]

            mediaQueries.forEach((mq, index) => {
                expect(parseMq(mq)).toEqual(results[index])
            })
        })
    })
})
