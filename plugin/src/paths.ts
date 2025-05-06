const isWindows = process.platform === 'win32'

const toWinPath = (pathString: string) => {
    // todo not sure if we need it at all
    // return path.normalize(pathString).replace(/\//g, '\\')
    return pathString
}

export const toPlatformPath = (pathString: string) => {
    return isWindows
        ? toWinPath(pathString)
        : pathString
}
