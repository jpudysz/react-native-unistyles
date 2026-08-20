export type CSSMap = Map<string, Map<string, Map<string, any>>>

export type StylesheetResource = Readonly<{
    css: string
    href: string
}>

export type ServerStyleResourceSetProps = {
    className: string
    declarations: Map<string, any>
    isMq: boolean
    mediaQuery: string
    sourceHash: string
}

export type ServerStyleResources = {
    getStyles: (sourceHashes: Iterable<string>) => string
    getStylesheetResources: (sourceHashes: Iterable<string>) => Array<StylesheetResource>
    remove: (sourceHash: string) => void
    reset: () => void
    set: (props: ServerStyleResourceSetProps) => void
}

export type CreateServerStyleResources = () => ServerStyleResources | undefined
