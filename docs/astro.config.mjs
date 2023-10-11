import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

// https://astro.build/config
export default defineConfig({
    integrations: [starlight({
        title: 'Unistyles',
        customCss: ['./src/styles/custom.css'],
        logo: {
            src: './src/assets/logo.svg'
        },
        social: {
            github: 'https://github.com/jpudysz/react-native-unistyles'
        },
        sidebar: [{
            label: 'Start here',
            items: [{
                label: 'Setup',
                link: '/start/setup/'
            }, {
                label: 'Basic Usage',
                link: '/start/basic-usage/'
            }, {
                label: 'Migration from StyleSheet',
                link: '/start/migration-from-style-sheet/'
            }]
        }, {
            label: 'Reference',
            items: [{
                label: 'createStyleSheet',
                link: '/reference/create-style-sheet/'
            }, {
                label: 'useStyles',
                link: '/reference/use-styles/'
            }]
        }, {
            label: 'Examples',
            items: [{
                label: 'Breakpoints',
                link: '/example/breakpoints/'
            }, {
                label: 'Media queries',
                link: '/example/media-queries/'
            }, {
                label: 'Dynamic functions',
                link: '/example/dynamic-functions/'
            }, {
                label: 'Dynamic themes',
                link: '/example/dynamic-themes/'
            }, {
                label: 'Variants',
                link: '/example/variants/'
            }]
        }]
    })]
})
