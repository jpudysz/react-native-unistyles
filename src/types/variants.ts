export type ExtractVariantNames<T> = T extends (...args: any) => infer R
    ? ExtractVariantKeys<R>
    : ExtractVariantKeys<T>

type ExtractVariantKeys<T> = T extends object
    ? ExtractVariant<T[keyof T]>
    : never

type ExtractSubVariantKeys<T> = T extends object
    ? keyof Omit<T, 'default'> | undefined
    : never

type ExtractVariant<T> = T extends (...args: any) => infer R
    ? R extends { variants: infer V }
        ? { [key in keyof V]?: ExtractSubVariantKeys<V[key]> }
        : never
    : T extends { variants: infer V }
        ? { [key in keyof V]?: ExtractSubVariantKeys<V[key]> }
        : never
