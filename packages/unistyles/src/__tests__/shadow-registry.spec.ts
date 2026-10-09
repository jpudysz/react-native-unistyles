jest.mock('react-native-nitro-modules', () => ({
    NitroModules: {
        createHybridObject: () => ({
            init: () => {},
            addChangeListener: () => () => {},
            link: () => {},
        }),
    },
}))

import { UnistylesShadowRegistry } from '../specs/ShadowRegistry'

const shadowRegistry = UnistylesShadowRegistry as unknown as {
    add: (handle: object, styles: Array<unknown>) => void
    link: jest.Mock
}

const handleFor = (node: object) => ({
    __internalInstanceHandle: {
        stateNode: {
            node,
        },
    },
})

describe('UnistylesShadowRegistry.add', () => {
    it('should flatten style arrays nested deeper than three levels before linking', () => {
        const node = {}
        const link = jest.fn()

        shadowRegistry.link = link

        const styledText = { fontSize: 14 }
        const linkStyle = { color: 'blue' }
        const regular = { fontWeight: '400' }
        const bold = { fontWeight: '700' }
        const inline = { marginTop: 4 }

        shadowRegistry.add(handleFor(node), [styledText, [linkStyle, [regular, [bold, [inline, undefined]]]]])

        expect(link).toHaveBeenCalledTimes(1)
        expect(link.mock.calls[0]).toStrictEqual([node, [styledText, linkStyle, regular, bold, inline]])
    })

    it('should keep filtering out empty and undefined styles', () => {
        const node = {}
        const link = jest.fn()

        shadowRegistry.link = link

        const fontSize = { fontSize: 20 }

        shadowRegistry.add(handleFor(node), [undefined, {}, [[fontSize]]])

        expect(link.mock.calls[0]).toStrictEqual([node, [fontSize]])
    })
})
