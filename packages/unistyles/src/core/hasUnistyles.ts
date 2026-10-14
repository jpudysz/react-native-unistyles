// whether a style prop (also nested arrays) holds a unistyle, the only styles Unistyles updates
// a view without one renders like a React Native view, it never links
export const hasUnistyles = (style: unknown): boolean => {
    if (Array.isArray(style)) {
        return style.some(hasUnistyles)
    }

    if (!style || typeof style !== 'object') {
        return false
    }

    // own keys only, like the registry. A unistyle starts with its `unistyles_` key, so it exits early
    for (const key in style) {
        if (key.startsWith('unistyles_') && Object.prototype.hasOwnProperty.call(style, key)) {
            return true
        }
    }

    return false
}
