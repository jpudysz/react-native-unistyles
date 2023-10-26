import React from 'react'
import { Text, View, type StyleProp, type TextStyle, Button } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

export const Memoization: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)
    const [ count, setCount ] = React.useState(0)

    return (
        <View style={styles.container}>
            <Memoized text="With breakpoints" style={styles.withBreakpoints} />
            <Memoized text="No breakpoints" style={styles.noBreakpoints} />
            <Memoized text="Static" style={staticStyles.static} />
            <Button title={`Re-render (${count})`} onPress={() => setCount(count => count + 1)} />
        </View>
    )
}

const Memoized = React.memo<{text: string; style: StyleProp<TextStyle>}>(({ text, style }) =>
    <Text style={style}>{text} ({useRenderCount()})</Text>
)

const useRenderCount = () => {
    const count = React.useRef(0)
    count.current++

    return count.current
}

const stylesheet = createStyleSheet({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'space-between',
        resizeMode: 'contain'
    },
    withBreakpoints: {
        fontSize: 18,
        color: {
            xs: 'red',
            md: 'blue'
        }
    },
    noBreakpoints: {
        fontSize: 18
    }
})

const staticStyles = createStyleSheet({
    static: {
        fontSize: 18
    }
})
