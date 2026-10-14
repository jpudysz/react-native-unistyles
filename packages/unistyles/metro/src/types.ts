// the parts of Metro's API used here, without depending on a Metro version

export type Resolution = { type: 'sourceFile'; filePath: string } | { type: Exclude<string, 'sourceFile'> }

export type ResolutionContext = {
    originModulePath: string
    resolveRequest: ResolveRequest
}

export type ResolveRequest = (context: ResolutionContext, moduleName: string, platform: string | null) => Resolution

export type MetroConfig = {
    projectRoot?: string
    transformer?: {
        babelTransformerPath?: string
    }
    resolver?: {
        resolveRequest?: ResolveRequest | null
    }
}

export type BabelTransformerArgs = {
    // relative to the project root
    filename: string
    src: string
    options: {
        projectRoot: string
    }
    plugins?: Array<unknown>
}

export type BabelTransformer = {
    transform: (args: BabelTransformerArgs) => unknown
    getCacheKey?: (...args: Array<unknown>) => string
}

export type UnistylesMetroOptions = {
    debug?: boolean
}
