import { preprocessor, normalizeNumericValue, normalizeColor } from '../utils'
import type { BoxShadow, TextShadow, Transforms } from '../types'

describe('Normalizer', () => {
    describe('Box Shadow', () => {
        it ('should correctly convert all the RN shadows to BoxShadow', () => {
            const styles: Array<BoxShadow> = [
                {
                    shadowRadius: 3,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 3,
                        height: 2
                    },
                    shadowOpacity: 0.4
                },
                {
                    shadowRadius: 1,
                    shadowColor: '#abcabc',
                    shadowOffset: {
                        width: 0,
                        height: 0
                    },
                    shadowOpacity: 1
                },
                {
                    shadowRadius: 0,
                    shadowColor: '#7f11e0',
                    shadowOffset: {
                        width: 0,
                        height: 1
                    },
                    shadowOpacity: 0.3
                },
                {
                    shadowRadius: 3,
                    shadowColor: '#FF5733',
                    shadowOffset: {
                        width: -4,
                        height: -3
                    },
                    shadowOpacity: 0.5
                },
                {
                    shadowRadius: 0,
                    shadowColor: '#000000',
                    shadowOffset: {
                        width: 0,
                        height: 0
                    },
                    shadowOpacity: 0
                },
                {
                    shadowRadius: 20,
                    shadowColor: 'orange',
                    shadowOffset: {
                        width: 50,
                        height: 50
                    },
                    shadowOpacity: 1
                },
                {
                    shadowRadius: 3,
                    shadowColor: '#FF5733CC',
                    shadowOffset: {
                        width: 0,
                        height: -10
                    },
                    shadowOpacity: 0.5
                }
            ]
            const results: Array<string> = [
                '3px 2px 3px rgba(0,0,0,0.4)',
                '0 0 1px rgba(171,202,188,1)',
                '0 1px 0 rgba(127,17,224,0.3)',
                '-4px -3px 3px rgba(255,87,51,0.5)',
                '0 0 0 rgba(0,0,0,0)',
                '50px 50px 20px orange',
                '0 -10px 3px rgba(255,87,51,0.8)'
            ]

            styles.forEach((style, index) => {
                expect(preprocessor.createBoxShadowValue(style)).toEqual(results[index])
            })
        })
    })

    describe('Text Shadow', () => {
        it ('should correctly convert all the RN text shadows to TextShadow', () => {
            const styles: Array<TextShadow> = [
                {
                    textShadowColor: '#fff',
                    textShadowOffset: {
                        width: 4,
                        height: 5
                    },
                    textShadowRadius: 2
                },
                {
                    textShadowColor: '#000000',
                    textShadowOffset: {
                        width: 3,
                        height: 4
                    },
                    textShadowRadius: 5
                },
                {
                    textShadowColor: '#FF5733',
                    textShadowOffset: {
                        width: -1,
                        height: -1
                    },
                    textShadowRadius: 0
                },
                {
                    textShadowColor: 'red',
                    textShadowOffset: {
                        width: 0,
                        height: 0
                    },
                    textShadowRadius: 0
                },
                {
                    textShadowColor: '#FF5733CC',
                    textShadowOffset: {
                        width: -5,
                        height: -5
                    },
                    textShadowRadius: 0
                }
            ]
            const results: Array<string> = [
                '4px 5px 2px rgba(255,255,255,1)',
                '3px 4px 5px rgba(0,0,0,1)',
                '-1px -1px 0 rgba(255,87,51,1)',
                '0 0 0 red',
                '-5px -5px 0 rgba(255,87,51,0.8)'
            ]

            styles.forEach((style, index) => {
                expect(preprocessor.createTextShadowValue(style)).toEqual(results[index])
            })
        })
    })

    describe('Transforms', () => {
        it ('should correctly convert all the RN transforms to CSS transforms', () => {
            const styles: Array<Transforms> = [
                [
                    {
                        scaleX: 1
                    },
                    {
                        rotateX: '30deg'
                    }
                ],
                [
                    {
                        scaleY: 0.5
                    },
                    {
                        rotateY: '45deg'
                    },
                    {
                        translateX: 100
                    }
                ],
                [
                    {
                        matrix: [1, 0, 0, 1, 30, 50]
                    }
                ],
                [
                    {
                        perspective: 18
                    },
                    {
                        rotateZ: '0.785398rad'
                    },
                    {
                        skewX: '45deg'
                    }
                ],
                [
                    {
                        rotate: '0.5turn'
                    },
                    {
                        translateX: 20
                    },
                    {
                        scale: 2.5
                    },
                    {
                        skewX: '30deg'
                    },
                    {
                        skewY: '1.07rad'
                    }
                ]
            ]
            const results: Array<string> = [
                'scaleX(1) rotateX(30deg)',
                'scaleY(0.5) rotateY(45deg) translateX(100px)',
                'matrix(1,0,0,1,30,50)',
                'perspective(18px) rotateZ(0.785398rad) skewX(45deg)',
                'rotate(0.5turn) translateX(20px) scale(2.5) skewX(30deg) skewY(1.07rad)'
            ]

            styles.forEach((style, index) => {
                expect(preprocessor.createTransformValue(style)).toEqual(results[index])
            })
        })
    })

    describe('normalizeNumericValue', () => {
        it('should normalize numeric values', () => {
            const values: Array<number> = [
                5,
                6,
                12.5,
                17,
                -100
            ]

            values.forEach(value => {
                expect(normalizeNumericValue(value)).toEqual(`${value}px`)
            })
        })

        it('should not normalize numeric values equal to 0', () => {
            const value = 0

            expect(normalizeNumericValue(value)).toEqual(value)
        })
    })

    describe('normalizeColor', () => {
        it('should not normalize string colors', () => {
            const values: Array<string> = [
                'red',
                'orange',
                'pink',
                'purple',
                'black'
            ]

            values.forEach((value, index) => {
                expect(normalizeColor(value)).toEqual(values[index])
            })
        })

        it('should handle hex values with 3 chars', () => {
            const values: Array<string> = [
                '#f00',
                '#0f0',
                '#00f',
                '#ff0',
                '#f0f',
                '#0ff',
                '#fff',
                '#abc',
                '#123',
                '#456'
            ]
            const results: Array<string> = [
                'rgba(255,0,0,1)',
                'rgba(0,255,0,1)',
                'rgba(0,0,255,1)',
                'rgba(255,255,0,1)',
                'rgba(255,0,255,1)',
                'rgba(0,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(170,187,204,1)',
                'rgba(17,34,51,1)',
                'rgba(68,85,102,1)'
            ]

            values.forEach((value, index) => {
                expect(normalizeColor(value)).toEqual(results[index])
            })
        })

        it('should handle hex values with 6 chars', () => {
            const values: Array<string> = [
                '#ff0000',
                '#00ff00',
                '#0000ff',
                '#ffff00',
                '#ff00ff',
                '#00ffff',
                '#ffffff',
                '#aabbcc',
                '#112233',
                '#445566'
            ]
            const results: Array<string> = [
                'rgba(255,0,0,1)',
                'rgba(0,255,0,1)',
                'rgba(0,0,255,1)',
                'rgba(255,255,0,1)',
                'rgba(255,0,255,1)',
                'rgba(0,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(170,187,204,1)',
                'rgba(17,34,51,1)',
                'rgba(68,85,102,1)'
            ]

            values.forEach((value, index) => {
                expect(normalizeColor(value)).toEqual(results[index])
            })
        })

        it('should handle hex values with 8 chars', () => {
            const values: Array<string> = [
                '#ff0000ff',
                '#00ff00ff',
                '#0000ffff',
                '#ffff00ff',
                '#ff00ffff',
                '#00ffffff',
                '#ffffffff',
                '#aabbccdd',
                '#11223344',
                '#44556677'
            ]
            const results: Array<string> = [
                'rgba(255,0,0,1)',
                'rgba(0,255,0,1)',
                'rgba(0,0,255,1)',
                'rgba(255,255,0,1)',
                'rgba(255,0,255,1)',
                'rgba(0,255,255,1)',
                'rgba(255,255,255,1)',
                'rgba(170,187,204,0.8666666666666667)',
                'rgba(17,34,51,0.26666666666666666)',
                'rgba(68,85,102,0.4666666666666667)'
            ]

            values.forEach((value, index) => {
                expect(normalizeColor(value)).toEqual(results[index])
            })
        })

    })
})
