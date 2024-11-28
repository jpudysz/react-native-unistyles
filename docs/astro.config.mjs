import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'
import expressiveCode, { ExpressiveCodeTheme } from 'astro-expressive-code'
import fs from 'node:fs'

const themeJson = fs.readFileSync(new URL(`./theme.json`, import.meta.url), 'utf8')
const customTheme = ExpressiveCodeTheme.fromJSONString(themeJson)

const oldPaths = {
    'start': [
        'basic-usage',
        'benchmarks',
        'introduction',
        'migration-from-1',
        'migration-from-stylesheet',
        'setup',
    ],
    'reference': [
        'breakpoints',
        'compound-variants',
        'content-size-category',
        'create-stylesheet',
        'debugging',
        'dimensions',
        'dynamic-functions',
        'edge-to-edge',
        'errors',
        'faq',
        'media-queries',
        'plugins',
        'server-side-rendering',
        'testing',
        'theming',
        'unistyles-registry',
        'unistyles-runtime',
        'use-initial-theme',
        'use-styles',
        'unistyles-provider',
        'variants',
        'web-support'
    ],
    'other': [
        'for-library-authors',
        'for-sponsors',
    ],
    'examples': [
        'all'
    ]
}

export default defineConfig({
	integrations: [
        expressiveCode({
            themes: [customTheme],
            languages: ['typescript', 'tsx']
        }),
		starlight({
			title: 'react-native-unistyles',
            description: 'React Native StyleSheet 3.0',
            customCss: ['./src/styles/docs.css'],
            logo: {
                src: './public/favicon.svg'
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
						{ label: 'Introduction', slug: 'v3/start/introduction' },
                        { label: 'Getting started', slug: 'v3/start/getting-started' },
                        { label: 'Configuration', slug: 'v3/start/configuration' },
                        { label: 'New features', slug: 'v3/start/new-features' },
                        { label: 'Look under the hood', slug: 'v3/start/how-unistyles-works' },
                        { label: 'Migration guide', slug: 'v3/start/migration-guide' }
					],
				},
                {
                    label: 'Guides',
                    items: [
                        { label: 'Theming', slug: 'v3/guides/theming' },
                        { label: 'Expo Router', slug: 'v3/guides/expo-router' },
                        { label: 'Custom web', slug: 'v3/guides/custom-web' },
                        { label: 'Server side rendering', slug: 'v3/guides/server-side-rendering' },
                    ]
                },
                {
                    label: 'API reference',
                    items: [
                        { label: 'StyleSheet', slug: 'v3/references/stylesheet' },
                        { label: 'Unistyles Runtime', slug: 'v3/references/unistyles-runtime' },
                        { label: 'Dynamic Functions', slug: 'v3/references/dynamic-functions' },
                        { label: 'Breakpoints', slug: 'v3/references/breakpoints' },
                        { label: 'Media Queries', slug: 'v3/references/media-queries' },
                        { label: 'Variants', slug: 'v3/references/variants' },
                        { label: 'Compound Variants', slug: 'v3/references/compound-variants' },
                        { label: 'Web styles', slug: 'v3/references/web-styles' },
                        { label: 'Web Only Features', slug: 'v3/references/web-only' },
                        { label: 'Scoped theme', slug: 'v3/references/scoped-theme' },
                        { label: 'createUnistylesComponent', slug: 'v3/references/create-unistyles-component' },
                        { label: 'Pressable', slug: 'v3/references/pressable' },
                    ]
                },
                {
                    label: 'Other',
                    items: [
                        { label: 'How to report a bug?', slug: 'v3/other/how-to-report-bug' },
                        { label: 'Babel plugin', slug: 'v3/other/babel-plugin' },
                        { label: 'Dependencies', slug: 'v3/other/dependencies' },
                        { label: 'For library authors', slug: 'v3/other/for-library-authors' },
                        { label: 'For sponsors', slug: 'v3/other/for-sponsors' },
                        { label: 'FAQ', slug: 'v3/other/frequently-asked-questions' },
                    ]
                },
                {
                    label: 'Examples',
                    items: [
                        { label: 'All examples', slug: 'v3/examples/examples' },
                    ]
                },
                {
                    label: 'Unistyles 2.0 documentation', link: 'https://v2.unistyl.es'
                },
                {
                    label: 'React Native Crossroads', link: 'https://reactnativecrossroads.com'
                },
                {
                    label: 'Codemask', link: 'https://codemask.com'
                },
                {
                    label: 'Hire us!',
                    badge: 'Hot!',
                    link: 'https://x.com/messages/compose?recipient_id=769868612198887425'
                }
			],
		}),
        sitemap(),
	],
    redirects: Object.fromEntries(Object.entries(oldPaths).flatMap(([parentpath, subPaths]) => {
        return subPaths.map(subPath => {
            const path = `/${parentpath}/${subPath}`

            return [path, `/v2${path}`]
        })
    }))
});
