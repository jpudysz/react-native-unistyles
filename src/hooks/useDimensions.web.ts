import { useEffect, useRef, useState } from 'react'
import type { ScreenSize } from '../types'

export const useDimensions = (): ScreenSize => {
    const timerRef = useRef<number>()
    const [screenSize, setScreenSize] = useState<ScreenSize>({
        width: window.innerWidth,
        height: window.innerHeight
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
