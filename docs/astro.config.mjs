import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'
import expressiveCode from 'astro-expressive-code'

// https://astro.build/config
export default defineConfig({
    integrations: [
        expressiveCode({
            theme: 'github-dark-dimmed',
            languages: ['typescript', 'tsx']
        }),
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
                            link: '/v2/start/introduction/'
                        },
                        {
                            label: 'Setup',
                            link: '/v2/start/setup/'
                        },
                        {
                            label: 'Migration from 1.x',
                            link: '/v2/start/migration-from-1/'
                        },
                        {
                            label: 'Basic Usage',
                            link: '/v2/start/basic-usage/'
                        },
                        {
                            label: 'Migration from StyleSheet',
                            link: '/v2/start/migration-from-stylesheet/'
                        },
                        {
                            label: 'Benchmarks',
                            link: '/v2/start/benchmarks/'
                        }
                    ]
                },
                {
                    label: 'Reference',
                    items: [
                        {
                            label: 'createStyleSheet',
                            link: '/v2/reference/create-stylesheet/'
                        },
                        {
                            label: 'useStyles',
                            link: '/v2/reference/use-styles/'
                        },
                        {
                            label: 'UnistylesProvider',
                            link: '/v2/reference/unistyles-provider/',
                            badge: 'New'
                        },
                        {
                            label: 'Dynamic functions',
                            link: '/v2/reference/dynamic-functions/'
                        },
                        {
                            label: 'Theming',
                            link: '/v2/reference/theming/'
                        },
                        {
                            label: 'Edge to edge layout',
                            link: '/v2/reference/edge-to-edge/'
                        },
                        {
                            label: 'useInitialTheme',
                            link: '/v2/reference/use-initial-theme/'
                        },
                        {
                            label: 'Breakpoints',
                            link: '/v2/reference/breakpoints/'
                        },
                        {
                            label: 'Media queries',
                            link: '/v2/reference/media-queries/'
                        },
                        {
                            label: 'Variants',
                            link: '/v2/reference/variants/'
                        },
                        {
                            label: 'Compound variants',
                            link: '/v2/reference/compound-variants/'
                        },
                        {
                            label: 'Dimensions',
                            link: '/v2/reference/dimensions/'
                        },
                        {
                            label: 'Unistyles Registry',
                            link: '/v2/reference/unistyles-registry/'
                        },
                        {
                            label: 'Unistyles Runtime',
                            link: '/v2/reference/unistyles-runtime/'
                        },
                        {
                            label: 'Content size category',
                            link: '/v2/reference/content-size-category/'
                        },
                        {
                            label: 'Plugins',
                            link: '/v2/reference/plugins/'
                        },
                        {
                            label: 'Web support',
                            link: '/v2/reference/web-support/'
                        },
                        {
                            label: 'Server side rendering',
                            link: '/v2/reference/server-side-rendering/'
                        },
                        {
                            label: 'Debugging',
                            link: '/v2/reference/debugging/'
                        },
                        {
                            label: 'Testing',
                            link: '/v2/reference/testing/'
                        },
                        {
                            label: 'Errors',
                            link: '/v2/reference/errors/'
                        },
                        {
                            label: 'FAQ',
                            link: '/v2/reference/faq/'
                        }
                    ]
                },
                {
                    label: 'Examples',
                    items: [
                        {
                            label: 'All examples',
                            link: '/v2/examples/all'
                        }
                    ]
                },
                {
                    label: 'Other',
                    items: [
                        {
                            label: 'For library authors',
                            link: '/v2/other/for-library-authors/'
                        },
                        {
                            label: 'For Sponsors',
                            link: '/v2/other/for-sponsors/'
                        }
                    ]
                },
                {
                    label: 'Unistyles 1.x Documentation',
                    link: '/v1/docs/start/setup'
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
        sitemap()
    ]
})
