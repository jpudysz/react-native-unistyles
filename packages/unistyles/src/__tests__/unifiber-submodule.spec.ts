declare const __dirname: string

const { existsSync } = jest.requireActual('fs') as { existsSync(path: string): boolean }
const { join } = jest.requireActual('path') as { join(...parts: Array<string>): string }

describe('unifiber', () => {
    it('has the unifiber submodule checked out', () => {
        if (!existsSync(join(__dirname, '../unifiber/src/index.ts'))) {
            throw new Error('Unistyles: unifiber submodule missing, run git submodule update --init')
        }
    })
})
