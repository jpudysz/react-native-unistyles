import { useEffect, useRef, useState } from 'react'
import type { ScreenSize } from '../types'
import { isServer } from '../utils'

export const useDimensions = (): ScreenSize => {
    const timerRef = useRef<ReturnType<typeof setTimeout>>()
    const [screenSize, setScreenSize] = useState<ScreenSize>({
        width: isServer ? 0 : window.innerWidth,
        height: isServer ? 0 : window.innerHeight
    })

    useEffect(() => {
        const handleResize = () => {
            clearTimeout(timerRef.current)

            timerRef.current = setTimeout(() => setScreenSize({
                width: window.innerWidth,
                height: window.innerHeight
            }), 100)
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            clearTimeout(timerRef.current)
        }
    }, [])

    return screenSize
}
