// Next.js App Router smoke test. Packs react-native-unistyles, installs the tarball into a copy of this app
// (outside the workspace, the way users consume it), then checks the server rendered page with next dev and next start.
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const PORT = Number(process.env.PORT ?? 3123)
const APP_DIR = import.meta.dir
const PACKAGE_DIR = resolve(APP_DIR, '../../packages/unistyles')
const WORK_DIR = mkdtempSync(join(tmpdir(), 'unistyles-nextjs-e2e-'))
const SKIP = new Set(['run.ts', 'README.md', 'node_modules', '.next'])

let server: ReturnType<typeof spawn> | undefined

const stopServer = () => {
    try {
        if (server?.pid) process.kill(-server.pid)
    } catch {}
    server = undefined
}

const cleanup = () => {
    stopServer()
    if (!process.env.KEEP_E2E_DIR) rmSync(WORK_DIR, { recursive: true, force: true })
}

const fail = (message: string): never => {
    console.error(`nextjs e2e: ${message}`)
    process.exit(1)
}

const run = (command: string, args: Array<string>, cwd: string) => {
    if (spawnSync(command, args, { cwd, stdio: 'inherit' }).status !== 0) {
        fail(`${command} ${args.join(' ')} failed`)
    }
}

process.on('exit', cleanup)

// npm pack runs the package's prepare script, so the tarball holds a fresh lib build.
run('npm', ['pack', '--pack-destination', WORK_DIR], PACKAGE_DIR)

const { version } = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'))

cpSync(APP_DIR, WORK_DIR, { recursive: true, filter: (source) => !SKIP.has(source.split('/').pop()!) })

const manifest = JSON.parse(readFileSync(join(APP_DIR, 'package.json'), 'utf8'))

manifest.dependencies['react-native-unistyles'] = `file:./react-native-unistyles-${version}.tgz`
writeFileSync(join(WORK_DIR, 'package.json'), JSON.stringify(manifest, null, 2))

run('npm', ['install', '--no-audit', '--no-fund'], WORK_DIR)

const fetchPage = async () => {
    for (let attempt = 0; attempt < 120; attempt++) {
        try {
            return await fetch(`http://localhost:${PORT}/`)
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }

    return fail(`server did not start on port ${PORT}`)
}

const checkServer = async (mode: string, args: Array<string>) => {
    server = spawn('npx', ['next', ...args, '--port', String(PORT)], {
        cwd: WORK_DIR,
        stdio: 'inherit',
        detached: true,
    })

    const response = await fetchPage()
    const html = await response.text()

    stopServer()

    if (response.status !== 200) fail(`${mode}: GET / returned ${response.status}`)
    if (!html.includes('Hello from Unistyles')) fail(`${mode}: page content was not rendered`)
    if (!html.includes('<style id="unistyles-web">')) fail(`${mode}: server rendered Unistyles styles are missing`)

    console.log(`nextjs e2e: ${mode} passed`)
}

// Dev compiles without tree shaking, so it loads every module the server graph imports.
await checkServer('next dev', ['dev', '--webpack'])

run('npx', ['next', 'build', '--webpack'], WORK_DIR)
await checkServer('next start', ['start'])

console.log('nextjs e2e: all passed')
process.exit(0)
