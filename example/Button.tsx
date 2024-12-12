import { Pressable, PressableProps, Text } from "react-native";
import { StyleSheet, UnistylesVariants } from 'react-native-unistyles'

type ButtonProps = PressableProps & UnistylesVariants<typeof styles> & {
    style?: any;
    children?: React.ReactNode;
    disabled?: boolean;
}

export const Button: React.FunctionComponent<ButtonProps> = ({
    children,
    variant,
    disabled = false,
    ...props
}: ButtonProps) => {
    styles.useVariants({
        variant,
        disabled,
    });

    return (
        <Pressable style={() => styles.button} {...props}>
            <Text style={styles.text}>{children}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create((theme) => {
    return {
        button: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.gap(1),
            borderRadius: theme.gap(1),
            paddingVertical: theme.gap(1),
            variants: {
                variant: {
                    default: {
                        backgroundColor: theme.colors.accent,
                    },
                    destructive: {
                        backgroundColor: 'red',
                    },
                    outline: {
                        backgroundColor: 'white'
                    },
                    link: {
                        backgroundColor: theme.colors.accent,
                        textDecorationLine: "underline",
                    },
                },
                size: {
                    default: {
                        height: theme.gap(5),
                        paddingHorizontal: 16,
                    }
                },
                disabled: {
                    true: {
                        opacity: 0.5,
                        pointerEvents: "none",
                    },
                }
            },
        },
        text: {
            fontSize: 14,
            fontWeight: "500",
            variants: {
                variant: {
                    destructive: {
                        color: 'white'
                    },
                    outline: {
                        color: 'gray'
                    },
                    link: {
                        color: 'white'
                    },
                },
            },
        },
    };
});
