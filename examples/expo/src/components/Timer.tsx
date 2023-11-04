import React, { useLayoutEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'

type TimerProps = {
    onMeasureEnd: (time: number) => void
}

export const Timer: React.FunctionComponent<PropsWithChildren<TimerProps>> = ({
    children,
    onMeasureEnd
}) => {
    const [start] = useState(Date.now())

    useLayoutEffect(() => {
        onMeasureEnd(Date.now() - start)
    }, [])

    return (
        <React.Fragment>
            {children}
        </React.Fragment>
    )
}
