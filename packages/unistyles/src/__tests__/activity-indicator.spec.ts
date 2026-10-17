// ActivityIndicator's style belongs to the wrapper view React Native renders around the spinner
import { createUnistylesActivityIndicator } from '../core/createUnistylesActivityIndicator'
import { Tag, chain, fiber, hostFiber, refOf, root } from './fiberFixtures'

const mockAdd = jest.fn()

jest.mock('../specs', () => ({
    UnistylesShadowRegistry: {
        add: (...args: Array<unknown>) => mockAdd(...args),
        remove: () => {},
    },
}))

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => null,
}))

const UNISTYLE = { backgroundColor: 'red', unistyles_spinner: {} }

const linkedHost = (spinner: ReturnType<typeof hostFiber>) => {
    const ActivityIndicator = createUnistylesActivityIndicator((() => null) as any) as any
    const element = ActivityIndicator({ style: UNISTYLE })

    element.props.ref(refOf(spinner))

    return mockAdd.mock.calls[0][0].__internalInstanceHandle
}

beforeEach(() => mockAdd.mockClear())

describe('createUnistylesActivityIndicator', () => {
    it('links the wrapper host on iOS', () => {
        const wrapper = hostFiber({})
        const spinner = hostFiber({})

        chain(spinner, wrapper, root())

        expect(linkedHost(spinner)).toBe(wrapper)
    })

    it('links the wrapper host on Android, above the ProgressBar composite', () => {
        const wrapper = hostFiber({})
        const spinner = hostFiber({})

        chain(spinner, fiber(Tag.ClassComponent), wrapper, root())

        expect(linkedHost(spinner)).toBe(wrapper)
    })
})
