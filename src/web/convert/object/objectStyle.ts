import { deepMergeObjects } from '../../../utils'
import { keyInObject } from '../../utils'

type Styles = Record<string, any>
type Normalize<TStyles extends Styles> = (key: keyof TStyles, value: TStyles[keyof TStyles]) => any

const createStylesValue = <TStyles extends Styles>(styles: Array<TStyles>, normalize: Normalize<TStyles>) =>
    styles
        .map(style => {
            const [key] = Object.keys(style)

            if (!key) {
                return undefined
            }

            return normalize(key, style[key])
        })
        .filter(Boolean)
        .join(' ')

export const getObjectStyle = <TStyles extends Styles>(
    styles: Array<TStyles>,
    styleKey: string,
    normalize: Normalize<TStyles>
) => {
    const breakpoints = new Set<string>()
    const normalStyles: Array<TStyles> = []

    styles.forEach(style => {
        const [property] = Object.keys(style)

        if (!property) {
            return
        }

        const value = style[property]

        if (typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value ?? {}).forEach(breakpoint => breakpoints.add(breakpoint))

            return
        }

        normalStyles.push(style)
    })

    const breakpointStyles = Array.from(breakpoints).flatMap(breakpoint => {
        const stylesPerBreakpoint = styles.flatMap(style => {
            const [property] = Object.keys(style)

            if (!property) {
                return []
            }

            const value = style[property]

            if (typeof value === 'object' && !Array.isArray(value)) {
                return keyInObject(value, breakpoint) ? [{ [property]: value[breakpoint] }] : []
            }

            return []
        }) as Array<TStyles>

        return [
            {
                [breakpoint]: {
                    [styleKey]: createStylesValue(stylesPerBreakpoint, normalize)
                }
            }
        ]
    })

    return deepMergeObjects<Record<string, any>>(
        {
            [styleKey]: createStylesValue(normalStyles, normalize)
        },
        ...breakpointStyles
    )
}
