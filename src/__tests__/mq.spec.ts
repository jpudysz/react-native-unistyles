import { mq } from '../utils'

jest.mock('../core', () => ({
    unistyles: {
        registry: {
            breakpoints: {
                xs: 0,
                sm: 100,
                md: 200,
                lg: 300,
                xl: 400
            }
        }
    }
}))

describe('mq', () => {
    describe('mq util', () => {
        it ('should correctly return width media query', () => {
            const container = {
                flex: {
                    [mq.only.width(100, 200)]: 1,
                    [mq.only.width(0, 100)]: 2,
                    [mq.only.width(0, 0)]: 1,
                    [mq.only.width(undefined, 400)]: 3,
                    [mq.only.width(400)]: 1,
                    [mq.only.width('xs', 'lg')]: 1,
                    [mq.only.width()]: 0
                }
            }

            expect(container.flex).toEqual({
                ':w[100, 200]': 1,
                ':w[0, 100]': 2,
                ':w[0, 0]': 1,
                ':w[0, 400]': 3,
                ':w[400, Infinity]': 1,
                ':w[0, 300]': 1,
                ':w[0, Infinity]': 0
            })
        })

        it ('should correctly return height media query', () => {
            const container = {
                width: {
                    [mq.only.height(120, 750)]: 100,
                    [mq.only.height(0, 1000)]: 200,
                    [mq.only.height(0, 0)]: 125,
                    [mq.only.height(undefined, 250)]: 700,
                    [mq.only.height(75)]: 0,
                    [mq.only.height('md', 'xl')]: undefined,
                    [mq.only.height()]: 100
                }
            }

            expect(container.width).toEqual({
                ':h[120, 750]': 100,
                ':h[0, 1000]': 200,
                ':h[0, 0]': 125,
                ':h[0, 250]': 700,
                ':h[75, Infinity]': 0,
                ':h[200, 400]': undefined,
                ':h[0, Infinity]': 100
            })
        })

        it ('should correctly return combined media query', () => {
            const container = {
                backgroundColor: {
                    [mq.width(0, 100).and.height(500)]: 'red',
                    [mq.height(100, 200).and.width(undefined, 500)]: 'blue',
                    [mq.width(0, 100).and.height(500, -500)]: 'orange',
                    [mq.width(undefined, 200).and.height()]: 'green',
                    // @ts-ignore test invalid case, even if typescript secures it
                    [mq.width('xs', 'xxl').and.height('doesnt', 'exist')]: 'yellow'
                }
            }

            expect(container.backgroundColor).toEqual({
                ':w[0, 100]:h[500, Infinity]': 'red',
                ':w[0, 500]:h[100, 200]': 'blue',
                ':w[0, 100]:h[500, -500]': 'orange',
                ':w[0, 200]:h[0, Infinity]': 'green',
                ':w[0, 0]:h[0, 0]': 'yellow'
            })
        })

        it ('should allow for nulls', () => {
            const container = {
                backgroundColor: {
                    [mq.width(null, 100).and.height(300)]: 'red',
                    [mq.height(100, 300).and.width(500)]: 'blue',
                    [mq.width(null, 100).and.height(500)]: 'orange',
                    [mq.width(null, 999).and.height()]: 'green',
                    [mq.width(null).and.height(null)]: 'yellow'
                }
            }

            expect(container.backgroundColor).toEqual({
                ':w[0, 100]:h[300, Infinity]': 'red',
                ':w[500, Infinity]:h[100, 300]': 'blue',
                ':w[0, 100]:h[500, Infinity]': 'orange',
                ':w[0, 999]:h[0, Infinity]': 'green',
                ':w[0, Infinity]:h[0, Infinity]': 'yellow'
            })
        })

        it ('should allow for shortcuts', () => {
            const container = {
                backgroundColor: {
                    [mq.width(100, 200).and.height(300)]: 'red',
                    [mq.height(100, 300).and.width(500)]: 'blue',
                    [mq.width(100, 200).and.height(500, -500)]: 'orange',
                    [mq.width(undefined, 200).and.height()]: 'green',
                    [mq.width().and.height(null)]: 'yellow'
                }
            }

            expect(container.backgroundColor).toEqual({
                ':w[100, 200]:h[300, Infinity]': 'red',
                ':w[500, Infinity]:h[100, 300]': 'blue',
                ':w[100, 200]:h[500, -500]': 'orange',
                ':w[0, 200]:h[0, Infinity]': 'green',
                ':w[0, Infinity]:h[0, Infinity]': 'yellow'
            })
        })

        it('should do nothing for unknown props', () => {
            // @ts-ignore
            const value = mq.unknown

            expect(value).toBe(undefined)

            // @ts-ignore
            const partialValue1 = mq.only.width(100, 200).unknown

            expect(partialValue1).toBe(undefined)

            // @ts-ignore
            const partialValue2 = mq.only.height(100, 200).unknown

            expect(partialValue2).toBe(undefined)

            // @ts-ignore
            const partialValue3 = mq.width(100, 200).and.height(100, 200).unknown

            expect(partialValue3).toBe(undefined)

            // @ts-ignore
            const partialValue4 = mq.height(100, 200).and.width(100, 200).unknown

            expect(partialValue4).toBe(undefined)

            const value5 = mq.width(100, 200).and.height(100, 200).toString()

            expect(value5).toBe(':w[100, 200]:h[100, 200]')

            const value6 = mq.height(100, 200).and.width(100, 200).toString()

            expect(value6).toBe(':w[100, 200]:h[100, 200]')
        })
    })
})
