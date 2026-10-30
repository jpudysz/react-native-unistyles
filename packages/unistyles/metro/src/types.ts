// the parts of Metro's API used here, without depending on a Metro version

export type Resolution = { type: 'sourceFile'; filePath: string } | { type: Exclude<string, 'sourceFile'> }

export type ResolutionContext = {
    originModulePath: string
    resolveRequest: ResolveRequest
}

export type ResolveRequest = (context: ResolutionContext, moduleName: string, platform: string | null) => Resolution

export type MetroConfig = {
    projectRoot?: string
    resolver?: {
        resolveRequest?: ResolveRequest | null
    }
}
