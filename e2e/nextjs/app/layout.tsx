// The root layout is a server component. Importing the Unistyles config here is the documented
// App Router setup (docs: guides/server-side-rendering), so it must keep loading on the server.
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
