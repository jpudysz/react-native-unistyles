export type ColorKeys<T> = {
    [K in keyof T]: K extends string
        ? K extends `${string}color${string}` | `${string}Color${string}`
            ? K
            : never
        : never
}[keyof T]

export type UseUpdateVariantColorConfig<T extends Record<string, any>> = {
    animateCallback: (from: string, to: string) => void,
    colorKey: ColorKeys<T>,
    style: T,
    secretKey: string | undefined
}
