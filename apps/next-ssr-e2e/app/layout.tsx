import type { ReactNode } from 'react'

import { Style } from './Style'
import './unistyles'

export default function RootLayout({
    children,
    slot,
}: Readonly<{
    children: ReactNode
    slot: ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <Style>
                    <main>
                        {children}
                        {slot}
                    </main>
                </Style>
            </body>
        </html>
    )
}
