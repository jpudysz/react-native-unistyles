import { useNavigation } from '@react-navigation/native'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import React, { useState } from 'react'

enum Library {
    Unistyles = 'Unistyles',
    StyleSheet = 'StyleSheet'
}

const getAvgResult = (results: Array<number>) => {
    if (results.length === 0) {
        return 'N/A'
    }

    return parseFloat((results.reduce((a, b) => a + b, 0) / results.length).toFixed(2))
}

type BenchmarkProps = {
    title: string,
    description: string,
    stylesheet(onMeasureEnd: (time: number) => void): React.ReactNode,
    unistyles(onMeasureEnd: (time: number) => void): React.ReactNode
}

export const Benchmark: React.FunctionComponent<BenchmarkProps> = ({
    title,
    description,
    stylesheet,
    unistyles
}) => {
    const navigation = useNavigation()
    const { top } = useSafeAreaInsets()
    const [benchmark, setBenchmark] = useState({
        isMeasuring: false,
        library: undefined as Library | undefined,
        renderTime: {
            Unistyles: [] as Array<number>,
            StyleSheet: [] as Array<number>
        }
    })
    const avgStylesheet = getAvgResult(benchmark.renderTime[Library.StyleSheet])
    const avgUnistyles = getAvgResult(benchmark.renderTime[Library.Unistyles])
    const difference = avgUnistyles === 'N/A' || avgStylesheet === 'N/A'
        ? 'N/A'
        : parseFloat(((avgUnistyles as number) - (avgStylesheet as number)).toString()).toFixed(2)

    return (
        <View
            style={{
                ...styles.container,
                paddingTop: top
            }}
        >
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text>
                        ← Go back
                    </Text>
                </Pressable>
            </View>
            <View style={styles.buttons}>
                <Pressable
                    style={styles.stylesheetButton}
                    onPress={() => setBenchmark({
                        isMeasuring: false,
                        library: Library.Unistyles,
                        renderTime: {
                            Unistyles: [],
                            StyleSheet: []
                        }
                    })}
                >
                    <Text style={styles.buttonText}>
                        {benchmark.isMeasuring ? 'Measuring...' : 'Start benchmark'}
                    </Text>
                </Pressable>
            </View>
            <View style={styles.results}>
                <Text style={styles.title}>
                    {title}
                </Text>
                <Text>
                    {description}
                </Text>
            </View>
            {benchmark.library === Library.StyleSheet && (
                <React.Fragment>
                    {stylesheet(time => {
                        setBenchmark(prevState => {
                            if (prevState.renderTime.Unistyles.length < 10) {
                                setTimeout(() => {
                                    setBenchmark(prevState => ({
                                        ...prevState,
                                        library: Library.Unistyles
                                    }))
                                }, 1000)
                            }

                            return {
                                library: undefined,
                                isMeasuring: !(prevState.renderTime.StyleSheet.length === 9),
                                renderTime: {
                                    ...prevState.renderTime,
                                    StyleSheet: [...prevState.renderTime[Library.StyleSheet], time]
                                }
                            }
                        })
                    })}
                </React.Fragment>
            )}
            {benchmark.library === Library.Unistyles && (
                <React.Fragment>
                    {unistyles(time => {
                        setBenchmark(prevState => {
                            if (prevState.renderTime.StyleSheet.length < 10) {
                                setTimeout(() => {
                                    setBenchmark(prevState => ({
                                        ...prevState,
                                        library: Library.StyleSheet
                                    }))
                                }, 1000)
                            }

                            return {
                                ...prevState,
                                library: undefined,
                                renderTime: {
                                    ...prevState.renderTime,
                                    Unistyles: [...prevState.renderTime[Library.Unistyles], time]
                                }
                            }
                        })
                    })}
                </React.Fragment>
            )}
            <View style={styles.resultsRow}>
                <Text style={styles.libName}>
                    Unistyles
                </Text>
                <Text>
                    {benchmark.renderTime[Library.Unistyles]
                        .map((time, index) => `${index + 1}) ${time}ms `)
                    }
                </Text>
                <Text style={styles.result}>
                    Avg: {avgUnistyles} ms
                </Text>
            </View>
            <View style={styles.resultsRow}>
                <Text style={styles.libName}>
                    StyleSheet
                </Text>
                <Text>
                    {benchmark.renderTime[Library.StyleSheet]
                        .map((time, index) => `${index + 1}) ${time}ms `)
                    }
                </Text>
                <Text style={styles.result}>
                    Avg: {avgStylesheet} ms
                </Text>
            </View>
            <Text
                style={{
                    ...styles.difference,
                    color: difference === 'N/A'
                        ? 'black'
                        : parseFloat(difference) < 2.50
                            ? 'green'
                            : parseFloat(difference) < 5.00
                                ? 'orange'
                                : 'red'
                }}
            >
                Difference: {difference} ms
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        marginBottom: 50,
        marginHorizontal: 20
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'center',
        columnGap: 10
    },
    stylesheetButton: {
        backgroundColor: 'black',
        borderRadius: 8,
        padding: 15
    },
    uniStylesButton: {
        backgroundColor: 'pink',
        borderRadius: 8,
        padding: 15
    },
    buttonText: {
        color: 'white'
    },
    results: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        marginBottom: 50
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    libName: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 5
    },
    resultsRow: {
        marginHorizontal: 40,
        marginTop: 50,
        borderBottomWidth: 1,
        paddingBottom: 10
    },
    result: {
        marginTop: 10,
        fontSize: 20
    },
    difference: {
        marginTop: 30,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center'
    }
})
