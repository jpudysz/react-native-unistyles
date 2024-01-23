export type ExtractVariantNames<T> = T extends (...args: any) => infer R
    ? ExtractVariantKeys<R>
    : ExtractVariantKeys<T>

type ExtractVariantKeys<T> = T extends object
    ? ExtractVariant<T[keyof T]>
    : never

type HasTrue<T> = 'true' extends keyof T ? true : false
type HasFalse<T> = 'false' extends keyof T ? true : false

type ExtractSubVariantKeys<T> = T extends object
    ? [HasTrue<T>, HasFalse<T>] extends [true, true]
        ? keyof Omit<T, 'default'> | boolean | undefined
        : [HasTrue<T>] extends [true]
            ? keyof Omit<T, 'default'> | true | undefined
            : [HasFalse<T>] extends [true]
                ? keyof Omit<T, 'default'> | false | undefined
                : keyof Omit<T, 'default'>
    : never

type ExtractVariant<T> = T extends (...args: any) => infer R
    ? R extends { variants: infer V }
        ? { [key in keyof V]?: ExtractSubVariantKeys<V[key]> }
        : never
    : T extends { variants: infer V }
        ? { [key in keyof V]?: ExtractSubVariantKeys<V[key]> }
        : never
