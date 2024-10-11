import React from 'react'
import type { PropsWithChildren } from 'react'
import {Text} from 'react-native'
import {StyleSheet} from 'react-native-unistyles'

interface TypographyProps extends PropsWithChildren {
    value: number,
    isBold?: boolean,
    isCentered?: boolean,
    isPrimary?: boolean,
    size?: 'large' | 'small',
}

export const Typography: React.FunctionComponent<TypographyProps> = ({
    children,
    size,
    isBold = false,
    isCentered = false,
    isPrimary,
    value,
}) => {
    styles.useVariants({
        isBold,
        isCentered,
        isPrimary,
        size
    })

    return (
        <Text style={styles.title(value)}>
            {children}
        </Text>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    title: (value: number) => ({
        variants: {
            isBold: {
                true: {
                    fontWeight: 'bold',
                }
            },
            isCentered: {
                true: {
                    textAlign: 'center'
                }
            },
            isPrimary: {
                true: {
                    color: theme.colors.accent
                },
                default: {
                    color: theme.colors.typography
                }
            },
            size: {
                small: {
                    fontSize: rt.fontScale * 10 * value
                },
                large: {
                    fontSize: rt.fontScale * 30 * value
                },
                default: {
                    fontSize: rt.fontScale * 20 * value
                }
            }
        },
        compoundVariants: [
            {
                isPrimary: true,
                isBold: true,
                styles: {
                    color: 'orange'
                }
            }
        ]
    }),
}))
