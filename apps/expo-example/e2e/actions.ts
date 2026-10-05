import { useEffect, useRef } from 'react'

type ActionArgument = number | string | undefined
type Action = (argument?: ActionArgument) => unknown

const actions = new Map<string, Action>()

// Lets the e2e runner drive a screen the way its buttons do, names must be unique across mounted screens
export const useE2EAction = (name: string, action: Action) => {
    const actionRef = useRef(action)

    useEffect(() => {
        actionRef.current = action
    })

    useEffect(() => {
        const run: Action = argument => actionRef.current(argument)

        actions.set(name, run)

        return () => {
            if (actions.get(name) === run) {
                actions.delete(name)
            }
        }
    }, [name])
}

export const runAction = (name: string, argument?: ActionArgument) => {
    const action = actions.get(name)

    if (!action) {
        throw new Error(`No e2e action "${name}" is mounted`)
    }

    return action(argument)
}
