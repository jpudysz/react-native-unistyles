import React from 'react'
import { Pressable, Text } from 'react-native'

type ButtonProps = {
    color?: string,
    textColor?: string,
    title: string,
    onPress: VoidFunction
}

export const Button: React.FunctionComponent<ButtonProps> = ({
    onPress,
    title,
    textColor = 'white',
    color = '#29cbfa'
}) => (
    <Pressable
        onPress={onPress}
        style={{
            backgroundColor: color,
            padding: 10,
            borderRadius: 10
        }}
    >
        <Text style={{ color: textColor }}>
            {title}
        </Text>
    </Pressable>
)
