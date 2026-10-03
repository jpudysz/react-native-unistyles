import { pluginTester } from 'babel-plugin-tester'

import plugin from '../src/index'

pluginTester({
    plugin,
    pluginOptions: {
        debug: false,
        root: 'src',
    },
    babelOptions: {
        // metro parses with flow or typescript, both mark imports as value or type
        parserOpts: {
            plugins: ['typescript', 'jsx'],
        },
        generatorOpts: {
            retainLines: true,
        },
    },
    tests: [
        {
            title: 'Should remap host components imported from react-native root',
            code: `
                import { unstable_NativeText, unstable_NativeView } from 'react-native'

                // JSX needs a capitalized name, lowercase tags are host components
                export const RawText = unstable_NativeText
                export const RawView = unstable_NativeView
            `,
            output: `
                import { NativeText as unstable_NativeText } from 'react-native-unistyles/components/native/NativeText'
                import { NativeView as unstable_NativeView } from 'react-native-unistyles/components/native/NativeView'

                // JSX needs a capitalized name, lowercase tags are host components
                export const RawText = unstable_NativeText
                export const RawView = unstable_NativeView
            `,
        },
        {
            title: 'Should remap aliased host components and keep other react-native imports',
            code: `
                import { Platform, unstable_NativeText as RawText, unstable_NativeView as RawView } from 'react-native'

                export const Example = () => {
                    return (
                        <RawView>
                            <RawText>{Platform.OS}</RawText>
                        </RawView>
                    )
                }
            `,
            output: `
                import { NativeText as RawText } from 'react-native-unistyles/components/native/NativeText'
                import { NativeView as RawView } from 'react-native-unistyles/components/native/NativeView'
                import { Platform } from 'react-native'

                export const Example = () => {
                    return (
                        <RawView>
                            <RawText>{Platform.OS}</RawText>
                        </RawView>
                    )
                }
            `,
        },
        {
            title: 'Should remap host components imported from react-native internals',
            code: `
                import { NativeText as RawText } from 'react-native/Libraries/Text/TextNativeComponent'
                import NativeView from 'react-native/Libraries/Components/View/ViewNativeComponent'

                export const Example = () => {
                    return (
                        <NativeView>
                            <RawText>Hello world</RawText>
                        </NativeView>
                    )
                }
            `,
            output: `
                import { NativeText as RawText } from 'react-native-unistyles/components/native/NativeText'
                import NativeView from 'react-native-unistyles/components/native/NativeView'

                export const Example = () => {
                    return (
                        <NativeView>
                            <RawText>Hello world</RawText>
                        </NativeView>
                    )
                }
            `,
        },
        {
            title: 'Should ignore type imports of host components',
            code: `
                import type { unstable_NativeText } from 'react-native'

                export type Example = typeof unstable_NativeText
            `,
            output: `
                import type { unstable_NativeText } from 'react-native'

                export type Example = typeof unstable_NativeText
            `,
        },
        {
            title: 'Should ignore inline type imports of host components',
            code: `
                import { type unstable_NativeText, unstable_NativeView as RawView } from 'react-native'

                export type Example = typeof unstable_NativeText
                export const View = RawView
            `,
            output: `
                import { NativeView as RawView } from 'react-native-unistyles/components/native/NativeView'
                import { type unstable_NativeText } from 'react-native'

                export type Example = typeof unstable_NativeText
                export const View = RawView
            `,
        },
    ],
})
