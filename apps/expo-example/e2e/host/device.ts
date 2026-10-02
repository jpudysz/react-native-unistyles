/// <reference types="bun" />
import { closeSync, openSync } from 'node:fs'
import { resolve } from 'node:path'

export const APP_ID = 'com.codemask.expoexample'
export const APP_DIR = resolve(import.meta.dir, '../..')
export const APP_SCHEME = 'expo-example'

// Normalized to the screen, like argent frames
export type Rect = {
    x: number,
    y: number,
    width: number,
    height: number
}

export type Element = {
    label: string,
    id?: string,
    frame: Rect
}

export type Device = {
    build: (logPath: string) => void,
    install: () => void,
    launch: (url: string) => void,
    // Elements of expo-example only, so a found element proves the app is in the foreground
    describe: () => Array<Element>,
    tap: (x: number, y: number) => void,
    // The OS appearance, like the Control Center toggle
    setAppearance: (scheme: 'light' | 'dark') => void,
    screenshot: (path: string) => void,
    // True while the app process runs, a crash ends the run early
    isRunning: () => boolean
}

type ExecOptions = {
    cwd?: string,
    env?: Record<string, string>,
    // Streams stdout and stderr into a file instead of buffering them
    logPath?: string,
    check?: boolean
}

export const exec = (command: Array<string>, { cwd, env, logPath, check = true }: ExecOptions = {}) => {
    const log = logPath === undefined ? undefined : openSync(logPath, 'a')
    const result = Bun.spawnSync(command, {
        cwd,
        env: { ...process.env, ...env },
        stdout: log ?? 'pipe',
        stderr: log ?? 'pipe'
    })

    if (log !== undefined) {
        closeSync(log)
    }

    if (check && !result.success) {
        throw new Error(`${command.join(' ')} failed${logPath ? `, see ${logPath}` : `:\n${result.stderr?.toString()}`}`)
    }

    return result.stdout?.toString() ?? ''
}

export const center = (rect: Rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 })
