// Same output as React Native's processFontVariationSettings, eg. { wght: 700 } -> 'wght' 700
export const getFontVariationSettings = (fontVariationSettings: Record<string, number>) => ({
    fontVariationSettings: Object.keys(fontVariationSettings)
        .sort()
        .map((axis) => `${axis.includes("'") ? `"${axis}"` : `'${axis}'`} ${fontVariationSettings[axis]}`)
        .join(', '),
})
