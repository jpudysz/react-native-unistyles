import { useNavigation } from '@react-navigation/native'
import { Pressable, Text, View, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import React, { useState } from 'react'

enum Library {
    Unistyles = 'Unistyles',
    StyleSheet = 'StyleSheet'
}

const getAvgResultWithVariance = (results: Array<number>) => {
    const numberOfResults = results.length

    if (numberOfResults === 0) {
        return 'N/A'
    }

    return parseFloat((results.reduce((a, b) => a + b) / results.length).toFixed(2))
}

type BenchmarkProps = {
    title: string,
    boxes: number,
    testDelay: number,
    times: number,
    description: string,
    stylesheet(onMeasureEnd: (time: number) => void): React.ReactNode,
    unistyles(onMeasureEnd: (time: number) => void): React.ReactNode
}

export const Benchmark: React.FunctionComponent<BenchmarkProps> = ({
    boxes,
    title,
    description,
    stylesheet,
    unistyles,
    testDelay,
    times
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
    const avgStyleSheet = getAvgResultWithVariance(benchmark.renderTime[Library.StyleSheet])
    const avgUnistyles = getAvgResultWithVariance(benchmark.renderTime[Library.Unistyles])
    const difference = avgUnistyles === 'N/A' || avgStyleSheet === 'N/A'
        ? 'N/A'
        : ((avgUnistyles as number) - (avgStyleSheet as number)).toFixed(2)

    return (
        <ScrollView
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
                    disabled={benchmark.isMeasuring}
                    style={styles.stylesheetButton}
                    onPress={() => setBenchmark({
                        isMeasuring: true,
                        library: Library.StyleSheet,
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
                <Text style={styles.description}>
                    {description}
                </Text>
            </View>
            {benchmark.library === Library.StyleSheet && (
                <React.Fragment>
                    {stylesheet(time => {
                        setBenchmark(prevState => {
                            if (prevState.renderTime.Unistyles.length < times) {
                                setTimeout(() => {
                                    setBenchmark(prevState => ({
                                        ...prevState,
                                        library: undefined
                                    }))
                                }, testDelay)

                                setTimeout(() => {
                                    setBenchmark(prevState => ({
                                        ...prevState,
                                        library: Library.Unistyles
                                    }))
                                }, testDelay * 2)
                            }

                            return {
                                ...prevState,
                                isMeasuring: !(prevState.renderTime.StyleSheet.length === times - 1),
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
                            if (prevState.renderTime.StyleSheet.length < times) {
                                setTimeout(() => {
                                    setBenchmark(prevState => ({
                                        ...prevState,
                                        library: undefined
                                    }))
                                }, testDelay)

                                setTimeout(() => {
                                    setBenchmark(prevState => ({
                                        ...prevState,
                                        library: Library.StyleSheet
                                    }))
                                }, testDelay * 2)
                            }

                            return {
                                ...prevState,
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
                    StyleSheet
                </Text>
                <View style={styles.wrap}>
                    {benchmark.renderTime[Library.StyleSheet]
                        .map((time, index) => (
                            <Text key={index}>
                                {`${index + 1}) ${time}ms `}
                            </Text>
                        ))
                    }
                </View>
                <Text style={styles.result}>
                    Avg: {avgStyleSheet}ms
                </Text>
            </View>
            <View style={styles.resultsRow}>
                <Text style={styles.libName}>
                    Unistyles
                </Text>
                <View style={styles.wrap}>
                    {benchmark.renderTime[Library.Unistyles]
                        .map((time, index) => (
                            <Text key={index}>
                                {`${index + 1}) ${time}ms `}
                            </Text>
                        ))
                    }
                </View>
                <Text style={styles.result}>
                    Avg: {avgUnistyles}ms
                </Text>
            </View>
            <Text
                style={{
                    ...styles.difference,
                    color: difference === 'N/A'
                        ? 'black'
                        : parseFloat(difference) < 5.00
                            ? 'green'
                            : parseFloat(difference) < 10.00
                                ? 'orange'
                                : 'red'
                }}
            >
                Difference: +{difference}ms
            </Text>
            <Text style={styles.difference}>
                Cost per view: {difference === 'N/A'
                    ? 'N/A'
                    : `+${(parseFloat(difference) / boxes).toFixed(3)}ms`
                }
            </Text>
            <View style={styles.fakeSpacer} />
        </ScrollView>
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
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 20,
        marginBottom: 10
    },
    description: {
        paddingHorizontal: 20,
        textAlign: 'center'
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
    },
    wrap: {
        flexWrap: 'wrap',
        flexDirection: 'row'
    },
    fakeSpacer: {
        height: 100
    }
})
