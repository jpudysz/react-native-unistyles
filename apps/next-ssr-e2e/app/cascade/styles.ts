import { StyleSheet } from 'react-native-unistyles'

export const cascadeStyles = StyleSheet.create(theme => ({
    card: {
        backgroundColor: theme.colors.cascadeCard,
        borderRadius: 9,
        padding: 12,
        _web: {
            _classNames: 'author-cascade-override',
        },
    },
}))
