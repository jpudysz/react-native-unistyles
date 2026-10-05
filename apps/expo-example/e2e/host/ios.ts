/// <reference types="bun" />
import { join } from 'node:path'
import { APP_DIR, APP_ID, center, type Device, type Element, exec } from './device'

const APP_PATH = join(APP_DIR, 'ios/build/Build/Products/Release-iphonesimulator/expoexample.app')
const LAUNCH_TIMEOUT_MS = 30_000
const HOME_TITLE = 'Unistyles'
// iOS asks before a custom scheme opens an app for the first time
const OPEN_PROMPT = 'Open in “expo-example”?'

// argent describe lines: `  AXGroup "label" id="id" value="value"  (x, y, width, height)`, controls (switches,
// inputs) list their value before the id
const LINE = /^\s*\S+(?: "(.*?)")?(?: value=".*?")?(?: id="(.*?)")?(?: value=".*?")?\s+\(([\d.-]+), ([\d.-]+), ([\d.-]+), ([\d.-]+)\)$/

const parseDescribe = (description: string): Array<Element> =>
    description.split('\n').flatMap(line => {
        const match = LINE.exec(line)

        if (!match) {
            return []
        }

        const [x, y, width, height] = match.slice(3).map(Number) as [number, number, number, number]

        return [{ label: match[1] ?? '', id: match[2], frame: { x, y, width, height } }]
    })

export const createIOS = (udid: string): Device => {
    const argent = (tool: string, ...args: Array<string>) => exec(['argent', 'run', tool, '--udid', udid, ...args])
    // The AX tree only covers the foreground app (or a system prompt above it)
    const describe = () => parseDescribe(JSON.parse(argent('describe', '--json')).description)
    const tap = (x: number, y: number) => argent('gesture-tap', '--x', String(x), '--y', String(y))
    const waitFor = (isReady: (elements: Array<Element>) => boolean, what: string) => {
        const deadline = Date.now() + LAUNCH_TIMEOUT_MS

        while (true) {
            const elements = describe()

            if (isReady(elements)) {
                return elements
            }

            if (Date.now() > deadline) {
                throw new Error(`expo-example did not show ${what}`)
            }

            Bun.sleepSync(500)
        }
    }

    return {
        build: logPath =>
            exec([
                'xcodebuild',
                '-workspace',
                'ios/expoexample.xcworkspace',
                '-scheme',
                'expoexample',
                '-configuration',
                'Release',
                '-sdk',
                'iphonesimulator',
                '-destination',
                `id=${udid}`,
                '-derivedDataPath',
                'ios/build',
                'build'
            ], { cwd: APP_DIR, logPath }),
        install: () => exec(['xcrun', 'simctl', 'install', udid, APP_PATH]),
        // Launches first and opens the URL once home renders, so the link reaches a running app
        launch: url => {
            exec(['xcrun', 'simctl', 'terminate', udid, APP_ID], { check: false })
            exec(['xcrun', 'simctl', 'launch', udid, APP_ID])
            waitFor(elements => elements.some(element => element.label === HOME_TITLE), 'its home screen')
            exec(['xcrun', 'simctl', 'openurl', udid, url])
            Bun.sleepSync(1000)

            const prompt = describe()

            if (prompt.some(element => element.label === OPEN_PROMPT)) {
                const open = prompt.find(element => element.label === 'Open')

                if (open) {
                    tap(center(open.frame).x, center(open.frame).y)
                }
            }
        },
        describe,
        tap,
        setAppearance: scheme => exec(['xcrun', 'simctl', 'ui', udid, 'appearance', scheme]),
        screenshot: path => argent('screenshot', '--scale', '1', '--out', path),
        isRunning: () => exec(['xcrun', 'simctl', 'spawn', udid, 'launchctl', 'list'], { check: false }).includes(`UIKitApplication:${APP_ID}`)
    }
}
