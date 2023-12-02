import { useInsertionEffect, useRef } from 'react'
import { unistyles } from '../core'
import type { ReactNativeStyleSheet } from '../types'
import { generateReactNativeWebId } from '../utils'

export const useCSS = <T>(stylesheet: ReactNativeStyleSheet<T>) => {
    const insertedIds = useRef<Array<string>>([])

    useInsertionEffect(() => {
        if (!unistyles.registry.config.experimentalCSSMediaQueries) {
            return
        }

        Object
            .entries(stylesheet)
            .forEach(([_key, value]) => {
                Object.entries(value!)
                    .forEach(([prop, val]) => {
                        if (!val.toString().includes('@media')) {
                            return
                        }

                        const id = generateReactNativeWebId(prop, '""')

                        if (insertedIds.current.includes(id)) {
                            return
                        }

                        const style = document.createElement('style')

                        style.id = id
                        style.innerHTML = val

                        document.head.appendChild(style)
                        insertedIds.current = [...insertedIds.current, id]
                    })
            })

        return () => {
            insertedIds.current.forEach(id => {
                const style = document.getElementById(id)

                if (style) {
                    style.remove()
                }
            })

            insertedIds.current = []
        }
    }, [stylesheet])
}
