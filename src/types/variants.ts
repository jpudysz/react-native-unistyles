export type ExtractVariantNames<T> = T extends object
    ? {
        [K in keyof T]: T[K] extends { variants: infer V }
            ? V extends object
                ?  { [VK in keyof V]: VK extends 'default'
                    ? never : VK }[keyof V] | ExtractVariantNames<V>
                : never
            : ExtractVariantNames<T[K]>
    }[keyof T]
    : never

