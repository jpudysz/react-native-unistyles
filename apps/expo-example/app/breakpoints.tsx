import React from 'react'
import { Text, View } from 'react-native'
import { Display, Hide, StyleSheet, mq, useUnistyles } from 'react-native-unistyles'
import { Screen, Section } from '../components'

export default function BreakpointsScreen() {
    const { rt } = useUnistyles()

    return (
        <Screen>
            <Section title="Current breakpoint" description={`${rt.breakpoint}, ${rt.screen.width}x${rt.screen.height}, ${rt.isPortrait ? 'portrait' : 'landscape'}`}>
                <View style={styles.breakpointBox}>
                    <Text style={styles.text}>Breakpoint driven background</Text>
                </View>
                <View style={styles.mqBox}>
                    <Text style={styles.text}>mq driven border</Text>
                </View>
            </Section>
            <Section title="Display and Hide">
                <Display mq={mq.only.width(0, 'md')}>
                    <Text style={styles.text}>Displayed below md</Text>
                </Display>
                <Hide mq={mq.only.width(0, 'md')}>
                    <Text style={styles.text}>Displayed from md</Text>
                </Hide>
            </Section>
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    breakpointBox: {
        padding: theme.gap(2),
        borderRadius: 8,
        backgroundColor: {
            xs: theme.colors.primary,
            md: theme.colors.secondary,
            xl: theme.colors.accent
        }
    },
    mqBox: {
        padding: theme.gap(2),
        borderRadius: 8,
        borderWidth: 2,
        borderColor: {
            [mq.only.width(0, 'md')]: theme.colors.accent,
            [mq.only.width('md')]: theme.colors.primary
        }
    },
    text: {
        color: theme.colors.typography
    }
}))
