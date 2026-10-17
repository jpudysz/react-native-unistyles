// unifiber is a git submodule: a clone or worktree without it can't resolve ../../unifiber/src
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const submodule = 'packages/unistyles/src/unifiber'
const entry = path.join(root, submodule, 'src', 'index.ts')

if (!existsSync(entry)) {
    try {
        execFileSync('git', ['submodule', 'update', '--init', submodule], { cwd: root, stdio: 'inherit' })
    } catch {}
}

if (!existsSync(entry)) {
    console.error(`Unistyles: the unifiber submodule is missing, run: git submodule update --init ${submodule}`)
    process.exit(1)
}
