import React, { useRef, useState } from 'react'
import { Text, View, type TextStyle, Button, ScrollView } from 'react-native'
import { UnistylesRuntime, createStyleSheet, mq, useStyles } from 'react-native-unistyles'
import { DemoScreen } from '../components'
import { autoGuidelinePlugin } from '../plugins'

enum TextVariant {
    sm = 'sm',
    md = 'md',
}

type VariantState = {
    size: TextVariant | undefined
}

export const MemoizationScreen: React.FunctionComponent = () => {
    const [count, setCount] = useState(0)
    const [variant, setVariant] = useState<VariantState>()
    const { styles, theme } = useStyles(stylesheet, variant)

    return (
        <DemoScreen>
            <View style={styles.container}>
                <ScrollView>
                    <Text>
                        Unistyles respects React.memo
                    </Text>
                    <Memoized
                        text="Static"
                        style={styles.text}
                    />
                    <Memoized
                        text="Breakpoints"
                        style={styles.breakpoints}
                    />
                    <Memoized
                        text="Media queries"
                        style={styles.mediaQueries}
                    />
                    <Memoized
                        text="Dynamic fn"
                        style={styles.dynamicFunction()}
                    />
                    <Memoized
                        text="Variants"
                        style={styles.textVariants}
                    />
                    <View style={styles.actions}>
                        <Button
                            color={theme.colors.typography}
                            title={`Re-render (${count})`}
                            onPress={() => setCount(count => count + 1)}
                        />
                        <Button
                            color={theme.colors.typography}
                            title="Change theme"
                            onPress={() => {
                                switch (UnistylesRuntime.themeName) {
                                    case 'light':
                                        return UnistylesRuntime.setTheme('dark')
                                    case 'dark':
                                        return UnistylesRuntime.setTheme('premium')
                                    case 'premium':
                                    default:
                                        return UnistylesRuntime.setTheme('light')
                                }
                            }}
                        />
                        <Button
                            color={theme.colors.typography}
                            title="Change variant"
                            onPress={() => {
                                if (!variant) {
                                    return setVariant({ size: TextVariant.sm })
                                }

                                switch (variant.size) {
                                    case TextVariant.sm:
                                        return setVariant({ size: TextVariant.md })
                                    case TextVariant.md:
                                    default:
                                        return setVariant(undefined)
                                }
                            }}
                        />
                        <Button
                            color={theme.colors.typography}
                            title="Toggle plugin"
                            onPress={() => {
                                UnistylesRuntime.enabledPlugins.includes(autoGuidelinePlugin.name)
                                    ? UnistylesRuntime.removePlugin(autoGuidelinePlugin)
                                    : UnistylesRuntime.addPlugin(autoGuidelinePlugin)
                            }}
                        />
                        <Text style={styles.centerText}>
                            Try to rotate your screen or change window size to re-render stylesheet
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </DemoScreen>
    )
}

const useRenderCount = () => {
    const count = useRef(0)

    count.current++

    return count.current
}

type MemoizedProps = {
    text: string,
    style: TextStyle
}

const Memoized = React.memo<MemoizedProps>(({ text, style }) => (
    <Text style={style}>
        {text} ({useRenderCount()})
    </Text>
))

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'space-between',
        rowGap: 10,
        backgroundColor: theme.colors.backgroundColor
    },
    actions: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.typography,
        marginTop: 20
    },
    centerText: {
        textAlign: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
        color: theme.colors.typography
    },
    text: {
        fontSize: 18,
        color: theme.colors.typography
    },
    dynamicFunction: () => ({
        fontSize: 18,
        color: theme.colors.typography
    }),
    breakpoints: {
        fontSize: {
            sm: 18,
            md: 20
        },
        color: theme.colors.typography
    },
    mediaQueries: {
        fontSize: {
            [mq.only.width('sm')]: 18,
            [mq.width('md').and.height(100)]: 20
        },
        color: theme.colors.typography
    },
    textVariants: {
        variants: {
            size: {
                sm: {
                    fontSize: 20
                },
                md: {
                    fontSize: 22
                },
                default: {
                    fontSize: 18
                }
            }
        },
        color: theme.colors.typography
    }
}))
