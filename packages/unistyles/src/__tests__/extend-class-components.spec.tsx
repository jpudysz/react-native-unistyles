// libraries extend React Native's class components, eg. react-native-pdf's `class PdfViewFlatList extends FlatList`,
// with react-native-unistyles/metro their `react-native` imports resolve to src/components/native
import React from 'react'

const mockAdd = jest.fn()
const mockRemove = jest.fn()

jest.mock('../specs', () => ({
    UnistylesShadowRegistry: {
        add: (...args: Array<unknown>) => mockAdd(...args),
        remove: (...args: Array<unknown>) => mockRemove(...args),
    },
}))

// the Unistyles components are rendered as plain functions, outside of React
jest.mock('react', () => {
    const actual = jest.requireActual('react')

    return {
        ...actual,
        useContext: () => null,
        useRef: (value: unknown) => ({ current: value }),
        useMemo: (factory: () => unknown) => factory(),
    }
})

const ReactNative: Record<string, any> = jest.requireActual('react-native')
const Unistyles: Record<string, any> = require('../components/native/index.ts')

// the components React Native exports as classes
const CLASS_COMPONENTS: Record<string, Record<string, unknown>> = {
    FlatList: { data: [], renderItem: () => null },
    SectionList: { sections: [], renderItem: () => null },
    VirtualizedList: { data: [], renderItem: () => null, getItem: () => null, getItemCount: () => 0 },
    KeyboardAvoidingView: {},
    RefreshControl: { refreshing: false },
    ImageBackground: { source: { uri: 'https://unistyl.es/image.png' } },
}

const UNISTYLE = { backgroundColor: 'red', unistyles_box: {} }

const SUBCLASS = `
    class PdfViewFlatList extends Base {
        constructor(props) {
            super(props)
            this.extended = true
        }

        extendedMethod() {
            return this.props
        }
    }

    PdfViewFlatList.extendedStatic = 'static'

    return PdfViewFlatList
`

const { transformSync } = require('@babel/core')

// Jest's types don't declare require.resolve
const { resolve } = require as unknown as { resolve: (id: string, options?: { paths: Array<string> }) => string }

// the class transform of @react-native/babel-preset, used without Hermes' native classes
const transformClasses = require(
    resolve('@babel/plugin-transform-classes', { paths: [resolve('@react-native/babel-preset')] }),
)

const compile = (loose?: boolean, code = SUBCLASS) =>
    transformSync(code, {
        babelrc: false,
        configFile: false,
        parserOpts: { allowReturnOutsideFunction: true },
        plugins: loose === undefined ? [] : [[transformClasses, { loose }]],
    }).code as string

// not transformed by Jest, so `native` keeps the class syntax, like Hermes with native classes
const CLASS_OUTPUTS = [
    ['native classes', compile()],
    ["Babel's class transform", compile(false)],
    ["Babel's loose class transform", compile(true)],
] as const

const extend = (code: string, Base: unknown) => new Function('Base', code)(Base)

const CLASS_KEYS = ['contextType', 'contextTypes', 'childContextTypes', 'getDerivedStateFromProps']

// React's own checks of a component type, see shouldConstruct and validateFunctionComponentInDev
const isClassForReact = (Component: any) => Boolean(Component.prototype?.isReactComponent)
const getFunctionComponentWarnings = (Component: any) =>
    [
        typeof Component.prototype?.render === 'function' && 'render',
        Component.childContextTypes && 'childContextTypes',
        Component.contextTypes && 'contextTypes',
        typeof Component.getDerivedStateFromProps === 'function' && 'getDerivedStateFromProps',
        typeof Component.contextType === 'object' && Component.contextType !== null && 'contextType',
    ].filter(Boolean)
// see constructClassInstance, React warns when a class has a contextType key that isn't a context
const hasInvalidContextType = (Component: any) =>
    'contextType' in Component &&
    Component.contextType !== null &&
    Component.contextType?.$$typeof !== React.createContext(null).$$typeof

beforeEach(() => {
    mockAdd.mockClear()
    mockRemove.mockClear()
})

describe.each(Object.keys(CLASS_COMPONENTS))('%s', (name) => {
    const NativeComponent = ReactNative[name]
    const UnistylesComponent = Unistyles[name]
    const props = CLASS_COMPONENTS[name]!

    it("should be a class in React Native and a Unistyles' function component", () => {
        expect(isClassForReact(NativeComponent)).toBe(true)
        expect(UnistylesComponent).not.toBe(NativeComponent)
        expect(isClassForReact(UnistylesComponent)).toBe(false)
        expect(getFunctionComponentWarnings(UnistylesComponent)).toEqual([])
    })

    it('should keep linking unistyles', () => {
        const ref = jest.fn()
        const element = UnistylesComponent({ ...props, style: UNISTYLE, ref }) as React.ReactElement<any>
        const instance = {}

        expect(element.type).toBe(NativeComponent)

        element.props.ref(instance)

        expect(mockAdd).toHaveBeenCalledWith(instance, UNISTYLE, null)
        expect(ref).toHaveBeenCalledWith(instance)
    })

    it.each(CLASS_OUTPUTS)('should be extendable with %s', (_, code) => {
        const Subclass = extend(code, UnistylesComponent)
        const instance = new Subclass(props)

        expect(isClassForReact(Subclass)).toBe(true)
        expect(instance).toBeInstanceOf(NativeComponent)
        expect(instance).toBeInstanceOf(Subclass)
        expect(instance.extended).toBe(true)
        expect(instance.props).toBe(props)
        expect(instance.extendedMethod()).toBe(props)
        expect(Subclass.extendedStatic).toBe('static')

        // React reads these from the class it constructs
        expect(Subclass.contextType).toBe(NativeComponent.contextType)
        expect(Subclass.getDerivedStateFromProps).toBe(NativeComponent.getDerivedStateFromProps)
        expect(Subclass.defaultProps).toBe(NativeComponent.defaultProps)
        expect(hasInvalidContextType(Subclass)).toBe(false)

        // the Unistyles component stays a function component
        expect(isClassForReact(UnistylesComponent)).toBe(false)
        expect(getFunctionComponentWarnings(UnistylesComponent)).toEqual([])
    })

    it('should extend the class like React Native', () => {
        const Subclass = extend(compile(), UnistylesComponent)
        const ReactNativeSubclass = extend(compile(), NativeComponent)
        const instance = new Subclass(props)
        const reactNativeInstance = new ReactNativeSubclass(props)
        const members = (Component: any) => {
            const names = new Set<string>()

            for (let proto = Component.prototype; proto; proto = Object.getPrototypeOf(proto)) {
                Object.getOwnPropertyNames(proto).forEach((key) => names.add(key))
            }

            return [...names].sort()
        }

        expect(members(Subclass)).toEqual(members(ReactNativeSubclass))
        CLASS_KEYS.forEach((key) => expect([key, key in Subclass]).toEqual([key, key in ReactNativeSubclass]))
        expect(Object.keys(instance).sort()).toEqual(Object.keys(reactNativeInstance).sort())
    })
})

describe('VirtualizedList', () => {
    it('should give a subclass the context and state of the list', () => {
        const Subclass = extend(compile(), Unistyles.VirtualizedList)

        expect(Subclass.contextType).toBeDefined()
        expect(Subclass.getDerivedStateFromProps).toBeInstanceOf(Function)
        expect(Unistyles.VirtualizedList.contextType).toBeUndefined()
        expect(Unistyles.VirtualizedList.getDerivedStateFromProps).toBeUndefined()
    })

    it("should let a subclass override the list's static and prototype keys", () => {
        const Subclass = extend(compile(true), Unistyles.VirtualizedList)
        const context = React.createContext(null)
        const render = () => null

        Subclass.contextType = context
        Subclass.prototype.render = render

        expect(Subclass.contextType).toBe(context)
        expect(Subclass.prototype.render).toBe(render)
        expect(Unistyles.VirtualizedList.contextType).toBeUndefined()
        expect(Unistyles.VirtualizedList.prototype.render).toBeUndefined()
        expect(ReactNative.VirtualizedList.contextType).not.toBe(context)
    })
})

describe('copyComponentProperties', () => {
    const { copyComponentProperties } = require('../utils')

    class NativeComponent extends React.Component {
        render() {
            return 'native'
        }
    }

    const SUPER_RENDER = `
        return class extends Base {
            render() {
                return super.render() + ' extended'
            }
        }
    `

    // Babel's loose class transform reads `Base.prototype.render`, which React reads to tell a function component
    it.each([
        ['native classes', compile(undefined, SUPER_RENDER)],
        ["Babel's class transform", compile(false, SUPER_RENDER)],
    ])("should call the class' methods with super and %s", (_, code) => {
        const UnistylesComponent = copyComponentProperties(NativeComponent, () => 'unistyles')
        const Subclass = extend(code, UnistylesComponent)

        expect(UnistylesComponent({})).toBe('unistyles')
        expect(new Subclass({}).render()).toBe('native extended')
    })

    it('should copy the properties of a function component', () => {
        const NativeFunction = Object.assign(() => null, { displayName: 'Native', Context: {} })
        const UnistylesComponent: any = () => null

        expect(copyComponentProperties(NativeFunction, UnistylesComponent)).toBe(UnistylesComponent)
        expect(UnistylesComponent.displayName).toBe('Native')
        expect(UnistylesComponent.Context).toBe(NativeFunction.Context)
    })
})
