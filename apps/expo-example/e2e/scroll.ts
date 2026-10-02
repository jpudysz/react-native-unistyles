type Scrollable = {
    scrollTo?: (options: { y: number, animated: boolean }) => void,
    scrollToOffset?: (options: { offset: number, animated: boolean }) => void
}

const targets = new Map<string, Scrollable>()

// Callback ref that lets the e2e runner scroll a screen, create it at module scope so it stays stable
export const e2eScrollRef = (name: string) => (node: Scrollable | null) => {
    if (node) {
        targets.set(name, node)

        return
    }

    targets.delete(name)
}

export const scrollTarget = (name: string, y: number) => {
    const target = targets.get(name)

    if (!target) {
        throw new Error(`No scroll target "${name}" is mounted`)
    }

    if (target.scrollToOffset) {
        target.scrollToOffset({ offset: y, animated: false })

        return
    }

    target.scrollTo?.({ y, animated: false })
}
