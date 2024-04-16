import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export const Star = () => (
    <Svg
        width={71}
        height={71}
        fill="none"
    >
        <Path
            fill="#FFFDDE"
            d="m35.5 0 9.59 25.91L71 35.5l-25.91 9.59L35.5 71l-9.59-25.91L0 35.5l25.91-9.59L35.5 0Z"
        />
    </Svg>
)
