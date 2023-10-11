import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
    integrations: [starlight({
        title: 'Unistyles',
        description: "React Native StyleSheet 2.0",
        customCss: ['./src/styles/custom.css'],
        logo: {
            src: './src/assets/logo.svg'
        },
        social: {
            github: 'https://github.com/jpudysz/react-native-unistyles',
            'x.com': 'https://x.com/jpudysz'
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
                link: '/start/migration-from-stylesheet/'
            }]
        }, {
            label: 'Reference',
            items: [{
                label: 'createStyleSheet',
                link: '/reference/create-stylesheet/'
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
    }), sitemap()]
})
