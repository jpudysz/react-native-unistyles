import React, { useState } from 'react'
import { useStyles, createStyleSheet, UnistylesRuntime } from 'react-native-unistyles'
import { View, ScrollView, ImageBackground, Text, Pressable } from 'react-native'
import './styles'
import { Button } from './components'

type TVShow = {
    title: string,
    imageUri: string
}

const tvShows: Array<TVShow> = [
    {
        title: 'Spider-Man',
        imageUri: 'https://images.unsplash.com/photo-1529335764857-3f1164d1cb24?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Dragon Ball',
        imageUri: 'https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Minions',
        imageUri: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?q=80&w=2334&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Toy Story',
        imageUri: 'https://images.unsplash.com/photo-1616097970275-1e187b4ce59f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Chucky',
        imageUri: 'https://images.unsplash.com/photo-1613679074451-9ddcc1103cc8?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Batman vs Superman',
        imageUri: 'https://images.unsplash.com/photo-1611604548018-d56bbd85d681?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Star Wars',
        imageUri: 'https://images.unsplash.com/photo-1608889825146-c9276dc26bdc?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Deadpool',
        imageUri: 'https://images.unsplash.com/photo-1674448417387-345997fcd888?q=80&w=2835&auto=format&fit=crop&ixlib=rb-4.0.3&'
    },
    {
        title: 'Lego',
        imageUri: 'https://images.unsplash.com/photo-1610483178766-8092d96033f3?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        title: 'Mario',
        imageUri: 'https://images.unsplash.com/photo-1602620502036-e52519d58d92?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }
]

export const App: React.FunctionComponent = () => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <ImageBackground
                style={styles.background}
                source={{ uri: tvShows.at(selectedIndex)?.imageUri }}
            >
                <View style={styles.show}>
                    <Text style={styles.title}>
                        {tvShows.at(selectedIndex)?.title}
                    </Text>
                    <Pressable style={styles.cta}>
                        <Text style={styles.ctaText}>
                            Watch now
                        </Text>
                    </Pressable>
                </View>
                <ScrollView
                    horizontal
                    snapToInterval={200}
                    contentContainerStyle={styles.shows}
                >
                    {tvShows.map((tvShow, index) => (
                        <Button
                            key={tvShow.title}
                            label={tvShow.title}
                            imageUri={tvShow.imageUri}
                            isSelected={selectedIndex === index}
                            onFocus={() => setSelectedIndex(index)}
                        />
                    ))}
                </ScrollView>
                <View style={styles.stats}>
                    <Text style={styles.statsText}>
                        {UnistylesRuntime.screen.width}x{UnistylesRuntime.screen.height}
                    </Text>
                    <Text style={styles.statsText}>
                        {UnistylesRuntime.themeName}, {UnistylesRuntime.colorScheme}
                    </Text>
                    <Text style={styles.statsText}>
                        {UnistylesRuntime.breakpoint}
                    </Text>
                    <Text style={styles.statsText}>
                        {UnistylesRuntime.contentSizeCategory}
                    </Text>
                    <Text style={styles.statsText}>
                        {UnistylesRuntime.orientation}
                    </Text>
                </View>
            </ImageBackground>
        </View>
    )
}

const stylesheet = createStyleSheet(theme => ({
    container: {
        flex: 1
    },
    shows: {
        columnGap: 20,
        alignItems: 'flex-end',
        marginBottom: 40,
        paddingHorizontal: 100
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    show: {
        position: 'absolute',
        top: '20%',
        left: 100
    },
    title: {
        fontSize: 120,
        color: theme.colors.typography,
        textShadowColor: theme.colors.typography,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 3,
        fontWeight: 'bold'
    },
    cta: {
        backgroundColor: theme.colors.oak,
        maxWidth: 240,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        marginTop: 20
    },
    ctaText: {
        fontSize: 36,
        color: theme.colors.backgroundColor,
        fontWeight: 'bold'
    },
    stats: {
        position: 'absolute',
        top: 10,
        right: 10
    },
    statsText: {
        fontSize: 14,
        color: theme.colors.typography
    }
}))
