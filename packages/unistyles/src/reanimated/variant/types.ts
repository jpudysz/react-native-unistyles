type KeysOfUnion<T> = T extends T ? keyof T : never

export type ColorKeys<T> =
    KeysOfUnion<T> extends infer K
        ? K extends string
            ? K extends `${string}Color${string}`
                ? K
                : K extends `${string}color${string}`
                  ? K
                  : never
            : never
        : never

export type UseUpdateVariantColorConfig<T extends Record<string, any>> = {
    animateCallback?: (from: string, to: string) => void
    colorKey: ColorKeys<T>
    style: T
    secretKey: string | undefined
}
