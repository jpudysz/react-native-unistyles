import React from 'react'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Bell, Search } from 'lucide-react-native'

type HeaderProps = {
    categories: Array<{ id: string, name: string }>,
    activeCategory: string,
    setActiveCategory(category: string): void
}

const StyledBell = withUnistyles(Bell, theme => ({
    color: theme.colors.onTertiary
}))

const StyledSearch = withUnistyles(Search, theme => ({
    color: theme.colors.onBackground
}))

const StyledSearchInput = withUnistyles(TextInput, theme => ({
    placeholderTextColor: theme.colors.onBackground
}))

export const Header: React.FunctionComponent<HeaderProps> = ({
    categories,
    activeCategory,
    setActiveCategory
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.locationContainer}>
                <View>
                    <Text style={styles.currentLocation}>
                        Current Location
                    </Text>
                    <Text style={styles.locationText}>
                        Poland, Rzeszow
                    </Text>
                </View>
                <Pressable style={styles.iconContainer}>
                    <StyledBell size={24} />
                </Pressable>
            </View>
            <View style={styles.searchBar}>
                <View style={styles.absoluteContainer}>
                    <StyledSearch size={20}  />
                </View>
                <StyledSearchInput
                    style={styles.searchInput}
                    placeholder="Search destination"
                />
            </View>
            <ScrollView
                horizontal
                style={styles.categories}
                showsHorizontalScrollIndicator={false}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryButton,
                            activeCategory === category.id && styles.categoryButtonActive,
                        ]}
                        onPress={() => setActiveCategory(category.id)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                activeCategory === category.id && styles.categoryTextActive,
                            ]}>
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    header: {
        paddingHorizontal: Math.max(rt.insets.right, theme.gap(2)),
        paddingTop: Math.max(rt.insets.top, 30),
        backgroundColor: theme.colors.tertiary
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.gap(2),
    },
    currentLocation: {
        fontSize: 16,
        color: theme.colors.onTertiary
    },
    iconContainer: {
        backgroundColor: theme.colors.secondary,
        padding: theme.gap(1),
        borderRadius: theme.gap(2),
        width: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    locationText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.onTertiary,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: theme.gap(1),
        borderRadius: theme.gap(1),
        marginBottom: theme.gap(2),
    },
    searchInput: {
        flex: 1,
        paddingVertical: theme.gap(1),
        paddingHorizontal: theme.gap(5),
        fontSize: 16,
        color: theme.colors.secondary,
        borderRadius: theme.gap(1)
    },
    categories: {
        flexDirection: 'row',
        marginBottom: theme.gap(2),
    },
    categoryButton: {
        paddingHorizontal: theme.gap(1),
        paddingVertical: theme.gap(1),
        borderRadius: theme.gap(1),
        marginRight: theme.gap(1),
        backgroundColor: theme.colors.secondary
    },
    categoryButtonActive: {
        backgroundColor: theme.colors.secondary,
        fontWeight: 'bold'
    },
    categoryText: {
        fontSize: 14,
        color: theme.colors.onSecondary,
    },
    categoryTextActive: {
        color: theme.colors.onTertiary
    },
    absoluteContainer: {
        position: 'absolute',
        left: 20
    }
}))
