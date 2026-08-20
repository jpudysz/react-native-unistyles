import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

const getJavaScriptFiles = (directory: string): Array<string> =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            return getJavaScriptFiles(entryPath)
        }

        return entryPath.endsWith('.js') ? [entryPath] : []
    })

test('does not ship RSC stylesheet emitters in browser chunks', () => {
    const chunksDirectory = path.resolve(__dirname, '../.next/static/chunks')
    const bundle = getJavaScriptFiles(chunksDirectory)
        .map(file => fs.readFileSync(file, 'utf8'))
        .join('\n')

    // This browser-only anchor proves that the scan includes Unistyles code.
    expect(bundle).toContain('unistyles-resource-anchor')
    // The content-addressed href and React style resource element are created
    // only by the react-server conditional branches.
    expect(bundle).not.toContain('"unistyles:"')
    expect(bundle).not.toMatch(/\.createElement\(["']style["'],\{href:[^}]{0,160}precedence:/)
})
