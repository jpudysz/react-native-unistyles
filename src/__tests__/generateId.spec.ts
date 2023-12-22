import { generateReactNativeWebId } from '../utils'

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

describe('generateReactNativeWebId', () => {
    it('should generate a unique id', () => {
        expect(generateReactNativeWebId('backgroundColor', 'red')).toEqual('r-backgroundColor-1mjtqww')
    })
})
