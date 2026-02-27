import path from 'node:path'

const isWindows = process.platform === 'win32'

const toWinPath = (pathString: string) => {
    return path.normalize(pathString).replace(/\//g, '\\')
}

export const toPlatformPath = (pathString: string) => {
    return isWindows ? toWinPath(pathString) : pathString
}
