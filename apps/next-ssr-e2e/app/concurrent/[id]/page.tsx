import { StyleSheet } from 'react-native-unistyles'
import { ServerUnistylesStyles } from 'react-native-unistyles/server'
import { getWebProps } from 'react-native-unistyles/web'

const colors = {
    fast: '#405060',
    slow: '#102030',
} as const

type ConcurrentPageProps = {
    params: Promise<{
        id: keyof typeof colors
    }>
}

type ConcurrentBarrier = {
    fastAdded: Promise<void>
    resolveFastAdded: () => void
    resolveSlowAdded: () => void
    slowAdded: Promise<void>
}

declare global {
    var __unistylesConcurrentBarrier__: ConcurrentBarrier | undefined
}

const createBarrier = (): ConcurrentBarrier => {
    let resolveFastAdded = () => {}
    let resolveSlowAdded = () => {}
    const fastAdded = new Promise<void>(resolve => {
        resolveFastAdded = resolve
    })
    const slowAdded = new Promise<void>(resolve => {
        resolveSlowAdded = resolve
    })

    return {
        fastAdded,
        resolveFastAdded,
        resolveSlowAdded,
        slowAdded,
    }
}

const barrier = (globalThis.__unistylesConcurrentBarrier__ ??= createBarrier())

export default async function ConcurrentPage({ params }: ConcurrentPageProps) {
    const { id } = await params

    if (id === 'fast') {
        await barrier.slowAdded
    }

    const cardProps = getWebProps(styles.card(colors[id]))

    if (id === 'slow') {
        barrier.resolveSlowAdded()
        await barrier.fastAdded
        await new Promise(resolve => setTimeout(resolve, 50))
    } else {
        barrier.resolveFastAdded()
    }

    return (
        <>
            <section className={cardProps.className} data-class={cardProps.className} data-testid={`${id}-card`}>
                Concurrent {id} server page
            </section>
            <ServerUnistylesStyles />
        </>
    )
}

const styles = StyleSheet.create({
    card: (backgroundColor: string) => ({
        backgroundColor,
        padding: 13,
    }),
})
