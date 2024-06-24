import React from 'react'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'

export const Sun = () => (
    <Svg
        width={357}
        height={357}
        fill="none"
    >
        <Circle cx={178.5} cy={178.5} r={178.5} fill="url(#a)" />
        <Defs>
            <RadialGradient
                id="a"
                cx={0}
                cy={0}
                r={1}
                gradientTransform="rotate(46.593 -6.558 142.856) scale(371.472)"
                gradientUnits="userSpaceOnUse"
            >
                <Stop stopColor="#FACA6E" />
                <Stop offset={1} stopColor="#FF9A51" />
            </RadialGradient>
        </Defs>
    </Svg>
)
