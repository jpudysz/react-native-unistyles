export type Optional<T> = T | undefined
export type Nullable<T> = T | null
export type SafeReturnType<T> = T extends (...args: any) => infer R ? R : T
export type PartialBy<T, K> = Omit<T, K & keyof T> & Partial<Pick<T, K & keyof T>>
