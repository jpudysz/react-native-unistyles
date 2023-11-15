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
                    [mq.width(100, 200)]: 1,
                    [mq.width(0, 100)]: 2,
                    [mq.width(0, 0)]: 1,
                    [mq.width(undefined, 400)]: 3,
                    [mq.width(400)]: 1,
                    [mq.width('xs', 'lg')]: 1,
                    [mq.width()]: 0
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
                    [mq.height(120, 750)]: 100,
                    [mq.height(0, 1000)]: 200,
                    [mq.height(0, 0)]: 125,
                    [mq.height(undefined, 250)]: 700,
                    [mq.height(75)]: 0,
                    [mq.height('md', 'xl')]: undefined,
                    [mq.height()]: 100
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
                    [mq.width(0, 100).height(500)]: 'red',
                    [mq.height(100, 200).width(500)]: 'blue',
                    [mq.width(0, 100).height(500, -500)]: 'orange',
                    [mq.width(undefined, 200).height()]: 'green',
                    // @ts-ignore test invalid case, even if typescript secures it
                    [mq.width('xs', 'xxl').height('doesnt', 'exist')]: 'yellow'
                }
            }

            expect(container.backgroundColor).toEqual({
                ':w[0, 100]:h[500, Infinity]': 'red',
                ':w[500, Infinity]:h[100, 200]': 'blue',
                ':w[0, 100]:h[500, -500]': 'orange',
                ':w[0, 200]:h[0, Infinity]': 'green',
                ':w[0, 0]:h[0, 0]': 'yellow'
            })
        })

        it ('should allow for nulls', () => {
            const container = {
                backgroundColor: {
                    [mq.width(null, 100).height(300)]: 'red',
                    [mq.height(100, 300).width(500)]: 'blue',
                    [mq.width(null, 100).height(500)]: 'orange',
                    [mq.width(null, 999).height()]: 'green',
                    [mq.width(null).height(null)]: 'yellow'
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
                    [mq.w(100, 200).h(300)]: 'red',
                    [mq.h(100, 300).w(500)]: 'blue',
                    [mq.w(100, 200).h(500, -500)]: 'orange',
                    [mq.w(undefined, 200).h()]: 'green',
                    [mq.w().h(null)]: 'yellow'
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
    })
})
