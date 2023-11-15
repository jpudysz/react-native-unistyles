import type { MediaQuery, Nullable } from '../types'
import type { UnistylesBreakpoints } from '../global'
import { unistyles } from '../core'

export const MQSymbol = Symbol('unistyles-mq')

type MQValue = keyof UnistylesBreakpoints | number

type MQHandler = {
    w(wMin?: Nullable<MQValue>, wMax?: MQValue): WidthHandler,
    width(wMin?: Nullable<MQValue>, wMax?: MQValue): WidthHandler,
    h(hMin?: Nullable<MQValue>, hMax?: MQValue): HeightHandler,
    height(hMin?: Nullable<MQValue>, hMax?: MQValue): HeightHandler
}

type HeightHandler = {
    w(wMin?: Nullable<MQValue>, wMax?: MQValue): MediaQuery,
    width(wMin?: Nullable<MQValue>, wMax?: MQValue): MediaQuery
} & MediaQuery

type WidthHandler = {
    h(hMin?: Nullable<MQValue>, hMax?: MQValue): MediaQuery,
    height(hMin?: Nullable<MQValue>, hMax?: MQValue): MediaQuery
} & MediaQuery

type FinalHandler = {
    [MQSymbol]: true
}

enum MQProp {
    toString = 'toString',
    width = 'width',
    height = 'height',
    shortW = 'w',
    shortH = 'h'
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

const widthHandler = (hMin: Nullable<MQValue> = 0, hMax: MQValue = Infinity) => new Proxy<HeightHandler>({} as HeightHandler, {
    get: (target, prop, receiver) => {
        if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
            return () => `:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
        }

        if (prop === MQProp.width || prop === MQProp.shortW) {
            return (wMin: MQValue = 0, wMax: MQValue = Infinity) => new Proxy<FinalHandler>({} as FinalHandler, {
                get: (target, prop, receiver) => {
                    if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
                        return () => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
                    }

                    return Reflect.get(target, prop, receiver)
                }
            })
        }

        return Reflect.get(target, prop, receiver)
    }
})

const heightHandler = (wMin: Nullable<MQValue> = 0, wMax: MQValue = Infinity) => new Proxy({} as WidthHandler, {
    get: (target, prop, receiver) => {
        if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
            return () => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]`
        }

        if (prop === MQProp.height || prop === MQProp.shortH) {
            return (hMin: MQValue = 0, hMax: MQValue = Infinity) => new Proxy<FinalHandler>({} as FinalHandler, {
                get: (target, prop, receiver) => {
                    if (prop === Symbol.toPrimitive || MQProp.toString) {
                        return () => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
                    }

                    return Reflect.get(target, prop, receiver)
                }
            })
        }

        return Reflect.get(target, prop, receiver)
    }
})

export const mq = new Proxy({} as MQHandler, {
    get: (target, prop, receiver) => {
        if (prop === MQProp.shortW || prop === MQProp.width) {
            return heightHandler
        }

        if (prop === MQProp.shortH || prop === MQProp.height) {
            return widthHandler
        }

        return Reflect.get(target, prop, receiver)
    }
})
