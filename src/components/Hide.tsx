import React, { type PropsWithChildren } from 'react'
import { useMedia } from '../hooks'

type HideProps = { mq: symbol } & PropsWithChildren

export const Hide: React.FunctionComponent<HideProps> = ({ children, ...props }) => {
    const { isVisible } = useMedia(props)

    return !isVisible ? children : null
}
