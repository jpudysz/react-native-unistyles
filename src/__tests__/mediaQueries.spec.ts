import {
    extractValues,
    getKeyForCustomMediaQuery,
    isMediaQuery,
    isWithinTheHeight,
    isWithinTheWidth,
    isWithinTheWidthAndHeight
} from '../utils'
import type { ScreenSize } from '../types'

describe('utils', () => {
    describe('extractValues', () => {
        it('should correctly extract a width with both bounds', () => {
            const mediaQuery = 'w[100, 600]'

            expect(extractValues(mediaQuery)).toEqual([100, 600])
        })

        it('should correctly extract a width with lower bound equal to 0', () => {
            const mediaQuery = 'w[0, 400]'

            expect(extractValues(mediaQuery)).toEqual([0, 400])
        })

        it('should correctly extract a height with single value', () => {
            const mediaQuery = 'h[700]'

            expect(extractValues(mediaQuery)).toEqual([700])
        })

        it('should correctly extract a height with lower bound equal to 0', () => {
            const mediaQuery = 'h[0,]'

            expect(extractValues(mediaQuery)).toEqual([0])
        })

        it('should correctly extract a width with no lower bound', () => {
            const mediaQuery = 'w[,100]'

            expect(extractValues(mediaQuery)).toEqual([0,100])
        })
    })

    describe('isWithinTheWidth', () => {
        it('should return true if the screen width is within the media query', () => {
            const pairs = [
                {
                    width: 200,
                    query: 'w[120]'
                },
                {
                    width: 100,
                    query: 'w[,500]'
                },
                {
                    width: 0,
                    query: 'w[,500]'
                },
                {
                    width: 300,
                    query: 'w[300,500]'
                }
            ]

            pairs.forEach(({ width, query }) => {
                expect(isWithinTheWidth(query, width)).toEqual(true)
            })
        })

        it('should return false if the screen width is outside the media query', () => {
            const pairs = [
                {
                    width: 120,
                    query: 'w[200]'
                },
                {
                    width: 501,
                    query: 'w[,500]'
                },
                {
                    width: 700,
                    query: 'w[200,500]'
                }
            ]

            pairs.forEach(({ width, query }) => {
                expect(isWithinTheWidth(query, width)).toEqual(false)
            })
        })
    })

    describe('isWithinTheHeight', () => {
        it('should return true if the screen height is within the media query', () => {
            const pairs = [
                {
                    height: 200,
                    query: 'h[120]'
                },
                {
                    height: 100,
                    query: 'h[,500]'
                },
                {
                    height: 0,
                    query: 'h[,500]'
                },
                {
                    height: 300,
                    query: 'h[300,500]'
                }
            ]

            pairs.forEach(({ height, query }) => {
                expect(isWithinTheHeight(query, height)).toEqual(true)
            })
        })

        it('should return false if the screen height is outside the media query', () => {
            const pairs = [
                {
                    height: 120,
                    query: 'h[200]'
                },
                {
                    height: 501,
                    query: 'h[,500]'
                },
                {
                    height: 700,
                    query: 'h[200,500]'
                }
            ]

            pairs.forEach(({ height, query }) => {
                expect(isWithinTheHeight(query, height)).toEqual(false)
            })
        })
    })

    describe('isWithinTheWidthAndHeight', () => {
        it('should return true if the screen width and height are within the media query', () => {
            const pairs = [
                {
                    screenSize: {
                        width: 200,
                        height: 600
                    },
                    query: 'w[, 200]:h[600]'
                },
                {
                    screenSize: {
                        width: 200,
                        height: 600
                    },
                    query: 'w[110]:h[400]'
                },
                {
                    screenSize: {
                        width: 400,
                        height: 800
                    },
                    query: 'w[400, 800]:h[400, 800]'
                }
            ]

            pairs.forEach(({ screenSize, query }) => {
                expect(isWithinTheWidthAndHeight(query, screenSize)).toEqual(true)
            })
        })

        it('should return false if the screen width and height are outside the media query', () => {
            const pairs = [
                {
                    screenSize: {
                        width: 200,
                        height: 600
                    },
                    query: 'w[, 220]:h[620]'
                },
                {
                    screenSize: {
                        width: 200,
                        height: 600
                    },
                    query: 'w[290]:h[400]'
                },
                {
                    screenSize: {
                        width: 400,
                        height: 800
                    },
                    query: 'w[, 800]:h[, 700]'
                }
            ]

            pairs.forEach(({ screenSize, query }) => {
                expect(isWithinTheWidthAndHeight(query, screenSize)).toEqual(false)
            })
        })
    })

    describe('isMediaQuery', () => {
        it('should detect correct media queries', () => {
            const correctMediaQueries = [
                ':w[100]',
                ':w[100, 200]',
                ':w[, 300]',
                ':h[200]',
                ':h[0, 500]',
                ':h[, 750]',
                ':w[100]:h[200]',
                ':h[100]:w[200]',
                ':h[100, 200]:w[,400]',
                ':w[200]:h[200, 400]'
            ]

            correctMediaQueries.forEach(query => {
                expect(isMediaQuery(query)).toEqual(true)
            })
        })

        it('should detect incorrect media queries', () => {
            const incorrectMediaQueries = [
                ':w100]',
                ':w[100, 200',
                ':p[, 300]',
                ':&[200]',
                ':h[0 500]',
                ':h[p, 750]',
                ':w[0]:l[200]',
                ':[100]:w[200]',
                ':h(100, 200):w[400]',
                ':w[2OO]:h[200, 400]',
                '',
                'x',
                '>300',
                ']]w200[[',
                ':w[ 100]',
                ':w[ , 300]',
                ':w[ ,    200]:h[ 200 , 400]'
            ]

            incorrectMediaQueries.forEach(query => {
                expect(isMediaQuery(query)).toEqual(false)
            })
        })
    })

    describe('getKeyForCustomMediaQuery', () => {
        it('should return a key for string value based on media query', () => {
            const mediaQueries = [
                ['w[,200]', 'orange'],
                ['w[300, 400]', 'pink'],
                ['w[500, 600]', 'red']
            ] as Array<[string, string | number]>
            const screenSize: ScreenSize = {
                width: 300,
                height: 700
            }

            expect(getKeyForCustomMediaQuery(mediaQueries, screenSize)).toEqual('w[300, 400]')
        })

        it('should return a key for number value based on media query', () => {
            const mediaQueries = [
                ['w[,200]', 200],
                ['w[250]', 300]
            ] as Array<[string, string | number]>
            const screenSize: ScreenSize = {
                width: 300,
                height: 700
            }

            expect(getKeyForCustomMediaQuery(mediaQueries, screenSize)).toEqual('w[250]')
        })

        it('should return undefined for no match', () => {
            const mediaQueries = [
                ['w[,400]', 'green'],
                ['w[500, 999]', 'olive'],
                ['w[1000]', 'red']
            ] as Array<[string, string | number]>
            const screenSize: ScreenSize = {
                width: 450,
                height: 1000
            }

            expect(getKeyForCustomMediaQuery(mediaQueries, screenSize)).toEqual(undefined)
        })

        it('should handle correctly complex media queries', () => {
            const mediaQueries = [
                ['w[,300]:h[200,700]', 200],
                ['w[250]:h[701]', 300],
                ['w[200]', 500]
            ] as Array<[string, string | number]>
            const screenSize: ScreenSize = {
                width: 300,
                height: 700
            }

            expect(getKeyForCustomMediaQuery(mediaQueries, screenSize)).toEqual('w[,300]:h[200,700]')
        })
    })
})
