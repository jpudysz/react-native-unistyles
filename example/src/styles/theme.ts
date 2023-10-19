import { Unistyles } from 'react-native-unistyles'

const sharedColors = {
    barbie: '#ff9ff3',
    oak: '#1dd1a1',
    sky: '#48dbfb',
    fog: '#c8d6e5',
    aloes: '#00d2d3'
}

const lightTheme = {
    colors: {
        ...sharedColors,
        backgroundColor: '#ffffff',
        typography: '#000000'
    }
    // add any keys/functions/objects/arrays you want!
}

const darkTheme = {
    colors: {
        ...sharedColors,
        backgroundColor: '#000000',
        typography: '#ffffff'
    }
    // add any keys/functions/objects/arrays you want!
}

const customTheme = {
    colors: {
        ...sharedColors,
        backgroundColor: '#111111',
        typography: '#cccccc'
    }
}

Unistyles.Static.registerThemes({
    light: lightTheme,
    dark: darkTheme,
    custom: customTheme
})
