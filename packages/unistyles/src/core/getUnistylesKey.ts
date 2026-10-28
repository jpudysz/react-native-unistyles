// the registry links only the unistyles of a style (see collectStyle in specs/ShadowRegistry), so two styles with the
// same unistyles in the same order link a view the same way. A unistyle keeps its object until Unistyles rebuilds it,
// a dynamic function or new variants return a new one, so the key changes whenever the link would change
const ids = new WeakMap<object, number>()
let nextId = 0

const idOf = (unistyle: object) => {
    let id = ids.get(unistyle)

    if (id === undefined) {
        id = ++nextId
        ids.set(unistyle, id)
    }

    return id
}

const collectIds = (style: unknown, collected: Array<number>) => {
    if (Array.isArray(style)) {
        for (let i = 0; i < style.length; i++) {
            collectIds(style[i], collected)
        }

        return
    }

    if (!style || typeof style !== 'object') {
        return
    }

    // own keys whose value is an object, like the registry
    for (const key in style) {
        if (!key.startsWith('unistyles_') || !Object.prototype.hasOwnProperty.call(style, key)) {
            continue
        }

        const unistyle = (style as Record<string, unknown>)[key]

        if (typeof unistyle === 'object' && unistyle !== null) {
            collected.push(idOf(unistyle))
        }
    }
}

// '' for a style without unistyles
export const getUnistylesKey = (style: unknown): string => {
    const collected: Array<number> = []

    collectIds(style, collected)

    return collected.join(',')
}
