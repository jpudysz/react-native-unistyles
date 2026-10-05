/// <reference types="bun" />
import { writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { APP_DIR, APP_ID, type Device, type Element, exec } from './device'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47])

const ANDROID_HOME = process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk')
const ADB = join(ANDROID_HOME, 'platform-tools/adb')
const APK_PATH = join(APP_DIR, 'android/app/build/outputs/apk/release/app-release.apk')
const DUMP_ATTEMPTS = 3

const decodeEntities = (value: string) =>
    value
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, '\'')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')

// uiautomator XML: `<node text="" resource-id="" package="" content-desc="" bounds="[x1,y1][x2,y2]" ...>`
const parseDump = (xml: string, width: number, height: number): Array<Element> =>
    [...xml.matchAll(/<node ([^>]*?)\/?>/g)].flatMap(([, attributes]) => {
        const attribute = (name: string) => decodeEntities(new RegExp(`(?:^| )${name}="([^"]*)"`).exec(attributes!)?.[1] ?? '')
        const [x1, y1, x2, y2] = (attribute('bounds').match(/\d+/g) ?? []).map(Number) as [number, number, number, number]

        if (attribute('package') !== APP_ID) {
            return []
        }

        return [{
            label: attribute('content-desc') || attribute('text'),
            id: attribute('resource-id') || undefined,
            frame: { x: x1 / width, y: y1 / height, width: (x2 - x1) / width, height: (y2 - y1) / height }
        }]
    })

export const createAndroid = (serial: string): Device => {
    const adb = (...args: Array<string>) => exec([ADB, '-s', serial, ...args])
    // `Override size` wins over `Physical size` when both are listed
    const [width, height] = adb('shell', 'wm', 'size').trim().split('\n').at(-1)!.split(': ')[1]!.split('x').map(Number) as [number, number]

    return {
        // The JS bundle task does not track workspace packages, rerun it so Unistyles changes land in the bundle
        build: logPath =>
            exec(['./gradlew', ':app:createBundleReleaseJsAndAssets', '--rerun', ':app:assembleRelease', '-PreactNativeArchitectures=arm64-v8a'], {
                cwd: join(APP_DIR, 'android'),
                env: { ANDROID_HOME },
                logPath
            }),
        install: () => adb('install', '-r', APK_PATH),
        launch: url => {
            adb('shell', 'am', 'force-stop', APP_ID)
            // adb joins arguments into one device shell command, quote the url for its `&`
            adb('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', `'${url}'`, APP_ID)
        },
        // uiautomator waits for an idle UI and sometimes gives up on a still screen, an infinite animation always fails it
        describe: () => {
            for (let attempt = 1; attempt <= DUMP_ATTEMPTS; attempt++) {
                const dump = adb('exec-out', 'uiautomator', 'dump', '/dev/tty')

                if (!dump.startsWith('ERROR')) {
                    return parseDump(dump, width, height)
                }
            }

            throw new Error('uiautomator could not get an idle state, keep infinite animations off screen at sync points')
        },
        tap: (x, y) => adb('shell', 'input', 'tap', String(Math.round(x * width)), String(Math.round(y * height))),
        setAppearance: scheme => adb('shell', 'cmd', 'uimode', 'night', scheme === 'dark' ? 'yes' : 'no'),
        screenshot: path => {
            const output = Buffer.from(Bun.spawnSync([ADB, '-s', serial, 'exec-out', 'screencap', '-p']).stdout)

            // With several displays screencap prints a warning before the image
            writeFileSync(path, output.subarray(Math.max(0, output.indexOf(PNG_SIGNATURE))))
        },
        isRunning: () => exec([ADB, '-s', serial, 'shell', 'pidof', APP_ID], { check: false }).trim() !== ''
    }
}
