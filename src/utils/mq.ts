import type { Nullable } from '../types'
import type { UnistylesBreakpoints } from '../global'
import { unistyles } from '../core'

export const MQSymbol = Symbol('unistyles-mq')
export const MQWidth = Symbol('unistyles-mq-width')
export const MQHeight = Symbol('unistyles-mq-height')
export const MQWidthAndHeight = Symbol('unistyles-mq-width-and-height')
export const MQHeightAndWidth = Symbol('unistyles-mq-height-and-width')

type MQValue = keyof UnistylesBreakpoints | number

type MQHandler = {
    only: {
        width(wMin?: Nullable<MQValue>, wMax?: MQValue): typeof MQWidth,
        height(hMin?: Nullable<MQValue>, hMax?: MQValue): typeof MQHeight,
    },
    width(wMin?: Nullable<MQValue>, wMax?: MQValue): {
        and: {
            height(hMin?: Nullable<MQValue>, hMax?: MQValue): typeof MQWidthAndHeight
        }
    },
    height(hMin?: Nullable<MQValue>, hMax?: MQValue): {
        and: {
            width(wMin?: Nullable<MQValue>, wMax?: MQValue): typeof MQHeightAndWidth
        }
    }
}

type FinalHandler = {
    [MQSymbol]: true
}

enum MQProp {
    toString = 'toString',
    width = 'width',
    height = 'height',
    only = 'only',
    and = 'and'
}

const getMQValue = (value: Nullable<MQValue>) => {
    if (typeof value === 'number') {
        return value
    }

    if (value === null) {
        return 0
    }

    return unistyles.registry.breakpoints[value] ?? 0
}

const widthHandler = (hMin: Nullable<MQValue> = 0, hMax: MQValue = Infinity) => new Proxy({} as MQHandler, {
    get: (target, prop, receiver) => {
        if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
            return () => `:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
        }

        if (prop === MQProp.and) {
            return {
                width: (wMin: MQValue = 0, wMax: MQValue = Infinity) => new Proxy<FinalHandler>({} as FinalHandler, {
                    get: (target, prop, receiver) => {
                        if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
                            return () => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
                        }

                        return Reflect.get(target, prop, receiver)
                    }
                })
            }
        }

        return Reflect.get(target, prop, receiver)
    }
})

const heightHandler = (wMin: Nullable<MQValue> = 0, wMax: MQValue = Infinity) => new Proxy({} as MQHandler, {
    get: (target, prop, receiver) => {
        if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
            return () => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]`
        }

        if (prop === MQProp.and) {
            return {
                height: (hMin: MQValue = 0, hMax: MQValue = Infinity) => new Proxy<FinalHandler>({} as FinalHandler, {
                    get: (target, prop, receiver) => {
                        if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
                            return () => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
                        }

                        return Reflect.get(target, prop, receiver)
                    }
                })
            }
        }

        return Reflect.get(target, prop, receiver)
    }
})

export const mq = new Proxy<MQHandler>({} as MQHandler, {
    get: (target, prop, receiver) => {
        if (prop === MQProp.only) {
            return {
                width: heightHandler,
                height: widthHandler
            }
        }

        if (prop === MQProp.height) {
            return widthHandler
        }

        if (prop === MQProp.width) {
            return heightHandler
        }

        return Reflect.get(target, prop, receiver)
    }
})
