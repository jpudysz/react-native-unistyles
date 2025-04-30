import '../unistyles'
import ScreenWithManyFeatures from '../app/(tabs)/index'
import { render } from '@testing-library/react-native'

describe('Example test', () => {
    test('should pass', () => {
        const tree = render(<ScreenWithManyFeatures />)

        expect(tree).toMatchSnapshot()
    })
})
