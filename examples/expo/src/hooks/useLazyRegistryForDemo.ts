import { useMemo } from 'react'

export const useLazyRegistryForDemo = (register: VoidFunction) => {
    useMemo(() => {
        // You shouldn't useMemo in your app, it's just for the demo
        // as we're having tons of screens with different setups
        // simply move it above the component, so you will hit registry only once!
        register()
    }, [])
}
