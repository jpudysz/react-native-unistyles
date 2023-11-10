import React from 'react'
import { Text, View, PlatformColor, Platform } from 'react-native'
import { createStyleSheet, useStyles } from '../styles'

export const PlatformColors: React.FunctionComponent = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text>
                Unistyles supports also PlatformColor!
            </Text>
        </View>
    )
}

const stylesheet = createStyleSheet({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                color: PlatformColor('label'),
                backgroundColor: PlatformColor('systemTealColor')
            },
            android: {
                color: PlatformColor('?android:attr/textColor'),
                backgroundColor: PlatformColor('@android:color/holo_blue_bright')
            },
            default: {
                color: 'black',
                backgroundColor: 'orange'
            }
        })
    },
    text: {
        color: {
            sm: PlatformColor('label'),
            md: PlatformColor('systemTealColor')
        }
    }
})
