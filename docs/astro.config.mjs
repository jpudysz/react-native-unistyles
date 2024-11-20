import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import sitemap from '@astrojs/sitemap'
import expressiveCode, { ExpressiveCodeTheme } from 'astro-expressive-code'
import fs from 'node:fs'

const themeJson = fs.readFileSync(new URL(`./theme.json`, import.meta.url), 'utf8')
const customTheme = ExpressiveCodeTheme.fromJSONString(themeJson)

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
					],
				}
			],
		}),
        sitemap()
	],
});
