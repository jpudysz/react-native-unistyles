type BoxShadow = {
    inset?: boolean
    offsetX?: number
    offsetY?: number
    blurRadius?: number
    spreadRadius?: number
    color?: string
}

const isValue = (str: string | undefined) => str && (str === '0' || str.endsWith('px'))

const parseBoxShadow = (str: string): BoxShadow | undefined => {
    if (str === 'none') {
        return undefined
    }

    // split by space, but not if it's inside of ()
    const parts = str.split(/\s+(?![^(]*\))/)
    const lastIndex = parts.length - 1
    const insetIndex = parts.findIndex(part => part === 'inset')

    // inset can only be at the start or end
    if (![-1, 0, lastIndex].includes(insetIndex)) {
        return undefined
    }

    // if there is no inset, color can only be at the start or end
    const maybeColorsIndexes = insetIndex === -1
        ? [0, lastIndex]
        : insetIndex === lastIndex
            ? [0, lastIndex - 1]
            : [1, lastIndex]

    const colorIndex = maybeColorsIndexes.find(index => !isValue(parts[index])) ?? -1
    const color = colorIndex !== -1
        ? parts[colorIndex]
        : undefined
    const values = parts.filter((_, index) => index !== colorIndex && index !== insetIndex)

    // at this point there can be only 4 values
    if (values.length > 4) {
        return undefined
    }

    const [offsetX, offsetY, blurRadius, spreadRadius] = values

    if (!isValue(offsetX) || !isValue(offsetY)) {
        return undefined
    }

    return {
        inset: insetIndex !== -1
            ? true
            : undefined,
        offsetX: Number.parseFloat(offsetX as string),
        offsetY: Number.parseFloat(offsetY as string),
        blurRadius: isValue(blurRadius)
            ? Number.parseFloat(blurRadius as string)
            : undefined,
        spreadRadius: isValue(spreadRadius)
            ? Number.parseFloat(spreadRadius as string)
            : undefined,
        color
    }
}

export const parseBoxShadowString = (str: string): Array<BoxShadow> => {
    const parts = str
        .split(/,(?![^()]*\))/)
        .map(part => part.trim().replace('\n', ''))
        .filter(Boolean)
        .map(parseBoxShadow)
        .filter(Boolean) as Array<BoxShadow>

    return parts
}
