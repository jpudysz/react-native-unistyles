import React from 'react'
import { Pressable, View, Image } from 'react-native'
import { useStyles, createStyleSheet } from 'react-native-unistyles'

type ButtonProps = {
    label: string,
    imageUri: string,
    isSelected: boolean,
    onFocus: VoidFunction
}

export const Button: React.FunctionComponent<ButtonProps> = ({
    onFocus,
    imageUri,
    isSelected
}) => {
    const { styles } = useStyles(stylesheet)

    return (
        <Pressable
            style={styles.button}
            onFocus={onFocus}
        >
            <Image
                resizeMode="cover"
                source={{ uri: imageUri }}
                style={styles.image(isSelected)}
            />
            <View style={styles.overlay(isSelected)} />
        </Pressable>
    )
}

const stylesheet = createStyleSheet(theme => ({
    button: {
        borderRadius: 20
    },
    image: (isSelected: boolean) => ({
        width: 200,
        height: 250,
        borderRadius: 20,
        transform: [
            {
                scale: isSelected ? 1.1 : 1
            }
        ],
        borderWidth: 2,
        borderColor: isSelected ? theme.colors.accent : 'transparent'
    }),
    label: {
        fontWeight: 'bold'
    },
    overlay: (isSelected: boolean) => ({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        backgroundColor: `rgba(0, 0, 0, ${isSelected ? 0 : 0.5})`
    })
}))
