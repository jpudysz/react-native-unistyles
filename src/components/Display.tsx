import React, { type PropsWithChildren } from 'react'
import { useMedia } from '../hooks'

type DisplayProps = { mq: symbol } & PropsWithChildren

export const Display: React.FunctionComponent<DisplayProps> = ({ children, ...props }) => {
    const { isVisible } = useMedia(props)

    return isVisible ? children : null
}
