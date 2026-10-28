import '../unistyles'
import { Style } from '../Style'

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>
                <Style>{children}</Style>
            </body>
        </html>
    )
}
