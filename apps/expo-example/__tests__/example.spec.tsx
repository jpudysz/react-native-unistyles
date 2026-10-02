import '../unistyles'
import DynamicFunctionsScreen from '../app/dynamic-functions'
import { render } from '@testing-library/react-native'

describe('Example test', () => {
    test('should pass', () => {
        const tree = render(<DynamicFunctionsScreen />)

        expect(tree).toMatchSnapshot()
    })
})
