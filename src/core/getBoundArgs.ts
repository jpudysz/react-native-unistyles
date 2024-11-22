export const getBoundArgs = (fn: Function) => {
    const boundArgs = [] as Array<any>

    fn.bind = function(thisArg, ...args) {
        boundArgs.push(...args)

        const newFn = Function.prototype.bind.apply(fn, [thisArg, ...args])

        newFn.getBoundArgs = function() {
            return boundArgs
        }

        return newFn
    }

    return fn
}
