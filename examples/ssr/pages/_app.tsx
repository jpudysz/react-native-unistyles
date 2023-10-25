import React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { UnistylesTheme } from 'react-native-unistyles'
import { theme } from '../styles'

const App = ({ Component, pageProps }: AppProps) => (
    <UnistylesTheme theme={theme}>
        <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Component {...pageProps} />
    </UnistylesTheme>
)

export default App
