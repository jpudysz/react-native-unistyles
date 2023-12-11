import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'
import expressiveCode from 'astro-expressive-code'

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: 'Unistyles',
            description: 'React Native StyleSheet 2.0',
            customCss: ['./src/styles/custom.css'],
            logo: {
                src: './src/assets/logo.svg'
            },
            social: {
                github: 'https://github.com/jpudysz/react-native-unistyles',
                'x.com': 'https://x.com/jpudysz',
                discord: 'https://discord.gg/akGHf27P4C'
            },
            sidebar: [
                {
                    label: 'Start here',
                    items: [
                        {
                            label: 'Introduction',
                            link: '/start/introduction/'
                        },
                        {
                            label: 'Setup',
                            link: '/start/setup/'
                        },
                        {
                            label: 'Migration from 1.x',
                            link: '/start/migration-from-1/'
                        },
                        {
                            label: 'Basic Usage',
                            link: '/start/basic-usage/'
                        },
                        {
                            label: 'Migration from StyleSheet',
                            link: '/start/migration-from-stylesheet/'
                        },
                        {
                            label: 'Benchmarks',
                            link: '/start/benchmarks/'
                        }
                    ]
                },
                {
                    label: 'Reference',
                    items: [
                        {
                            label: 'createStyleSheet',
                            link: '/reference/create-stylesheet/'
                        },
                        {
                            label: 'useStyles',
                            link: '/reference/use-styles/'
                        },
                        {
                            label: 'Dynamic functions',
                            link: '/reference/dynamic-functions/'
                        },
                        {
                            label: 'Theming',
                            link: '/reference/theming/'
                        },
                        {
                            label: 'useInitialTheme',
                            link: '/reference/use-initial-theme/'
                        },
                        {
                            label: 'Breakpoints',
                            link: '/reference/breakpoints/'
                        },
                        {
                            label: 'Media queries',
                            link: '/reference/media-queries/'
                        },
                        {
                            label: 'Variants',
                            link: '/reference/variants/'
                        },
                        {
                            label: 'Compound variants',
                            link: '/reference/compound-variants/'
                        },
                        {
                            label: 'Unistyles Registry',
                            link: '/reference/unistyles-registry/'
                        },
                        {
                            label: 'Unistyles Runtime',
                            link: '/reference/unistyles-runtime/'
                        },
                        {
                            label: 'Plugins',
                            link: '/reference/plugins/'
                        },
                        {
                            label: 'Web support',
                            link: '/reference/web-support/'
                        },
                        {
                            label: 'Server side rendering',
                            link: '/reference/server-side-rendering/'
                        },
                        {
                            label: 'Errors',
                            link: '/reference/errors/'
                        },
                        {
                            label: 'FAQ',
                            link: '/reference/faq/'
                        },
                        {
                            label: 'For library authors',
                            link: '/reference/for-library-authors/'
                        }
                    ]
                },
                {
                    label: 'Show case',
                    items: [
                        {
                            label: 'Projects',
                            link: '/show-case/projects/'
                        },
                        {
                            label: 'UI Kits',
                            link: '/show-case/ui-kits/'
                        }
                    ]
                },
                {
                    label: 'Examples',
                    items: [
                        {
                            label: 'All examples',
                            link: '/examples/all'
                        }
                    ]
                },
                {
                    label: 'Other',
                    items: [
                        {
                            label: 'Sponsors',
                            link: 'other/sponsors/'
                        },
                        {
                            label: 'For Sponsors',
                            link: 'other/for-sponsors/'
                        }
                    ]
                },
                {
                    label: 'React Native Crossroads',
                    link: 'https://reactnativecrossroads.com/'
                },
                {
                    label: 'Codemask',
                    link: 'https://codemask.com/'
                }
            ]
        }),
        sitemap(),
        expressiveCode({
            theme: 'github-dark-dimmed',
            languages: ['typescript', 'tsx']
        })
    ]
})
