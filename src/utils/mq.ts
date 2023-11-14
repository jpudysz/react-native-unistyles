import type { UnistylesBreakpoints } from '../global'
import { unistyles } from '../Unistyles'

const MQSymbol = Symbol('unistyles-mq')

type MQValue = keyof UnistylesBreakpoints | number

type HeightHandler = {
    width(wMin?: MQValue, wMax?: MQValue): typeof MQSymbol
} & typeof MQSymbol

type WidthHandler = {
    height(hMin?: MQValue, hMax?: MQValue): typeof MQSymbol
} & typeof MQSymbol

type FinalHandler = {
    [MQSymbol]: true
}

enum MQProp {
    toString = 'toString',
    width = 'width',
    height = 'height'
}

const getMQValue = (value: MQValue) => {
    if (typeof value === 'number') {
        return value
    }

    return unistyles.registry.breakpoints[value] ?? 0
}

export const mq = {
    height: (hMin: MQValue = 0, hMax: MQValue = Infinity) => new Proxy<HeightHandler>({} as HeightHandler, {
        get: (target, prop, receiver) => {
            if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
                return () => `:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
            }

            if (prop === MQProp.width) {
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
    }),
    width: (wMin: MQValue = 0, wMax: MQValue = Infinity) => new Proxy({} as WidthHandler, {
        get: (target, prop, receiver) => {
            if (prop === Symbol.toPrimitive || prop === MQProp.toString) {
                return () => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]`
            }

            if (prop === MQProp.height) {
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
}
