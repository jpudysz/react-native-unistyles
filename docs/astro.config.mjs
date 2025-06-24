import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'
import starlightLlmsTxt from 'starlight-llms-txt'
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
    site: 'https://unistyl.es/v3/',
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
                    label: 'Tutorial', slug: 'v3/tutorial/intro', badge: 'New!'
                },
                {
                    label: 'LLMS', slug: 'v3/llms/info', badge: 'Hot!',
                },
				{
					label: 'Start here',
					items: [
						{ label: 'Introduction', slug: 'v3/start/introduction' },
                        { label: 'Getting started', slug: 'v3/start/getting-started' },
                        { label: 'Configuration', slug: 'v3/start/configuration' },
                        { label: 'When to use Unistyles?', slug: 'v3/start/when-to-use-unistyles'},
                        { label: 'New features', slug: 'v3/start/new-features' },
                        { label: 'Look under the hood', slug: 'v3/start/how-unistyles-works' },
                        { label: 'Migration guide', slug: 'v3/start/migration-guide' },
                        { label: 'Testing', slug: 'v3/start/testing' }
					],
				},
                {
                    label: 'Guides',
                    items: [
                        { label: 'Merging styles', slug: 'v3/guides/merging-styles' },
                        { label: 'Why my view doesn\'t update?', slug: 'v3/guides/why-my-view-doesnt-update' },
                        { label: 'Theming', slug: 'v3/guides/theming' },
                        { label: 'Avoiding Keyboard', slug: 'v3/guides/avoiding-keyboard' },
                        { label: 'Expo Router', slug: 'v3/guides/expo-router' },
                        { label: 'React Compiler', slug: 'v3/guides/react-compiler' },
                        { label: 'Custom web', slug: 'v3/guides/custom-web' },
                        { label: 'Reanimated', slug: 'v3/guides/reanimated' },
                        { label: 'Server side rendering', slug: 'v3/guides/server-side-rendering' },
                    ]
                },
                {
                    label: 'API reference',
                    items: [
                        { label: 'StyleSheet', slug: 'v3/references/stylesheet' },
                        { label: 'Unistyles Runtime', slug: 'v3/references/unistyles-runtime' },
                        { label: 'Mini Runtime', slug: 'v3/references/mini-runtime' },
                        { label: 'Dynamic Functions', slug: 'v3/references/dynamic-functions' },
                        { label: 'Breakpoints', slug: 'v3/references/breakpoints' },
                        { label: 'Media Queries', slug: 'v3/references/media-queries' },
                        { label: 'Variants', slug: 'v3/references/variants' },
                        { label: 'Compound Variants', slug: 'v3/references/compound-variants' },
                        { label: 'Web styles', slug: 'v3/references/web-styles' },
                        { label: 'Web Only Features', slug: 'v3/references/web-only' },
                        { label: 'Scoped theme', slug: 'v3/references/scoped-theme', badge: 'Updated!' },
                        { label: 'Update 3rd party views', slug: 'v3/references/3rd-party-views' },
                        { label: 'withUnistyles', slug: 'v3/references/with-unistyles' },
                        { label: 'useUnistyles', slug: 'v3/references/use-unistyles' },
                        { label: 'Display and Hide', slug: 'v3/references/display-hide' },
                        { label: 'Edge to edge', slug: 'v3/references/edge-to-edge' },
                        { label: 'Dimensions', slug: 'v3/references/dimensions' },
                        { label: 'Content size category', slug: 'v3/references/content-size-category' },
                    ]
                },
                {
                    label: 'Other',
                    items: [
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
                        { label: 'All examples', slug: 'v3/examples/examples', badge: 'WIP' },
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
            plugins: [
                starlightLlmsTxt({
                    projectName: 'React Native Unistyles 3.0',
                    description: 'Easily style cross platform React Native apps with a single StyleSheet',
                    details: 'This documentation site is a source of truth for the good practices while building apps with React Native Unistyles.',
                    promote: [
                        'v3/start/**', 'v3/guides/**', 'v3/references/**'
                    ],
                    exclude: [
                        'v3/examples/**', 'v3/tutorial/**', 'v3/guides/custom-web', 'v3/other/for-sponsors'
                    ]
                })
            ]
		}),
        sitemap(),
	],
    redirects: Object.fromEntries(Object.entries(oldPaths).flatMap(([parentpath, subPaths]) => {
        return subPaths.map(subPath => {
            const path = `/${parentpath}/${subPath}`

            return [path, `https://v2.unistyl.es/${path}`]
        })
    }))
});
