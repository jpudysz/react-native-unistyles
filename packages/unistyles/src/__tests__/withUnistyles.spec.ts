import { getSecrets, listenToStyleChanges } from '../core/withUnistyles/withUnistyles.native'
import { UnistyleDependency } from '../specs/NativePlatform/NativePlatform.nitro'

const mockChangeListeners = new Set<(dependencies: Array<UnistyleDependency>) => void>()

jest.mock('../specs', () => ({
    UnistylesShadowRegistry: {},
    UnistyleDependency: jest.requireActual('../specs/NativePlatform/NativePlatform.nitro').UnistyleDependency,
    StyleSheet: {
        addChangeListener: (onChange: (dependencies: Array<UnistyleDependency>) => void) => {
            mockChangeListeners.add(onChange)

            return () => mockChangeListeners.delete(onChange)
        },
    },
}))

const emit = (...dependencies: Array<UnistyleDependency>) =>
    mockChangeListeners.forEach((onChange) => onChange(dependencies))

// react-native-unistyles/metro, a style depends on everything its StyleSheet read
describe('withUnistyles native without the Babel plugin', () => {
    it('re-renders only when the styles changed', () => {
        let width = 100
        const onChange = jest.fn()
        const dispose = listenToStyleChanges(
            [UnistyleDependency.Theme, UnistyleDependency.Dimensions, UnistyleDependency.Ime],
            () => ({ width }),
            onChange,
        )

        emit(UnistyleDependency.Ime)
        expect(onChange).not.toHaveBeenCalled()

        width = 200
        emit(UnistyleDependency.Dimensions)
        expect(onChange).toHaveBeenCalledTimes(1)

        emit(UnistyleDependency.Dimensions)
        expect(onChange).toHaveBeenCalledTimes(1)

        dispose()
        width = 300
        emit(UnistyleDependency.Dimensions)
        expect(onChange).toHaveBeenCalledTimes(1)
    })

    it("leaves theme changes to the component and re-renders for styles it can't compare", () => {
        const circular: Record<string, unknown> = {}
        const onChange = jest.fn()

        circular.self = circular

        const dispose = listenToStyleChanges(
            [UnistyleDependency.Theme, UnistyleDependency.Insets],
            () => circular,
            onChange,
        )

        emit(UnistyleDependency.Theme)
        expect(onChange).not.toHaveBeenCalled()

        emit(UnistyleDependency.Insets)
        expect(onChange).toHaveBeenCalledTimes(1)

        dispose()
    })
})

const nestedStyle = [{ color: 'black' }, [{ flex: 1 }, { fontSize: 17 }]]
const flatStyle = { color: 'black', flex: 1, fontSize: 17 }

describe('withUnistyles native nested styles', () => {
    it('flattens nested arrays, skips falsy values, and merges in order', () => {
        expect(
            getSecrets([null, false, [undefined, nestedStyle], [[[{ color: 'white', paddingTop: 4 }]]]]),
        ).toStrictEqual({
            styles: { ...flatStyle, color: 'white', paddingTop: 4 },
            dependencies: [],
        })
    })

    it('resolves nested Unistyles and returns their dependencies', () => {
        const unistyle = {
            unistyles_text: {
                uni__getStyles: () => ({ fontSize: 20 }),
                uni__dependencies: [UnistyleDependency.Theme, UnistyleDependency.Insets],
            },
        }

        expect(getSecrets([nestedStyle, [[unistyle]]])).toStrictEqual({
            styles: { ...flatStyle, fontSize: 20 },
            dependencies: [UnistyleDependency.Theme, UnistyleDependency.Insets],
        })
    })
})

// https://github.com/jpudysz/react-native-unistyles/issues/1309
describe('withUnistyles native Reanimated animated styles', () => {
    // Reanimated 3.x and 4.0
    const createHandle = () => ({ viewDescriptors: {}, initial: { value: {}, updater: () => ({}) } })
    // Reanimated 4.1+
    const createHandleWithUpdater = () => ({ ...createHandle(), styleUpdaterContainer: { current: undefined } })

    it('keeps the plain path as a single merged object', () => {
        const { styles } = getSecrets([{ flex: 1 }, [{ color: 'red' }]])

        expect(Array.isArray(styles)).toBe(false)
        expect(styles).toStrictEqual({ flex: 1, color: 'red' })
    })

    it('keeps an animated style after plain styles as a separate entry', () => {
        const box = { width: 40, height: 40 }
        const moving = createHandleWithUpdater()
        const { styles } = getSecrets([box, moving])

        expect(styles).toStrictEqual([box, moving])
        expect((styles as Array<object>)[1]).toBe(moving)
    })

    it('keeps every animated style', () => {
        const sized = createHandle()
        const moving = createHandleWithUpdater()
        const { styles } = getSecrets([sized, moving])

        expect(styles).toHaveLength(2)
        expect((styles as Array<object>)[0]).toBe(sized)
        expect((styles as Array<object>)[1]).toBe(moving)
    })

    it('keeps plain styles after an animated style in order', () => {
        const moving = createHandle()
        const { styles } = getSecrets([moving, { width: 40 }, { height: 40 }])

        expect(styles).toStrictEqual([moving, { width: 40, height: 40 }])
    })

    it('passes a single animated style through', () => {
        const sized = createHandle()

        expect(getSecrets(sized).styles).toStrictEqual([sized])
        expect(getSecrets([[sized]]).styles).toStrictEqual([sized])
    })

    it('merges only the styles between animated styles and returns Unistyles dependencies', () => {
        const first = createHandle()
        const second = createHandleWithUpdater()
        const unistyle = {
            unistyles_box: {
                uni__getStyles: () => ({ backgroundColor: 'red' }),
                uni__dependencies: [UnistyleDependency.Theme],
            },
        }

        expect(
            getSecrets([
                { flex: 1 },
                null,
                unistyle,
                first,
                [[{ width: 10 }, false]],
                { width: 20 },
                second,
                { opacity: 0.5 },
            ]),
        ).toStrictEqual({
            styles: [{ flex: 1, backgroundColor: 'red' }, first, { width: 20 }, second, { opacity: 0.5 }],
            dependencies: [UnistyleDependency.Theme],
        })
    })

    it('does not mutate the passed styles', () => {
        const box = { width: 40 }
        const moving = createHandle()

        getSecrets([box, { height: 40 }, moving])

        expect(box).toStrictEqual({ width: 40 })
        expect(Object.keys(moving)).toStrictEqual(['viewDescriptors', 'initial'])
    })

    it('handles contentContainerStyle the same way', () => {
        const moving = createHandle()

        expect(getSecrets([moving, { padding: 8 }]).styles).toStrictEqual([moving, { padding: 8 }])
    })

    it('does not treat objects with only some of the handle keys as animated styles', () => {
        expect(getSecrets([{ viewDescriptors: 1 }, { flex: 1 }]).styles).toStrictEqual({ viewDescriptors: 1, flex: 1 })
        expect(getSecrets([{ initial: 1 }, { flex: 1 }]).styles).toStrictEqual({ initial: 1, flex: 1 })
    })
})
