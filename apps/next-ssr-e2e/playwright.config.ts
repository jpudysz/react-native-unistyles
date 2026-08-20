import { defineConfig } from '@playwright/test'

const port = 3417

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: 'line',
    use: {
        baseURL: `http://127.0.0.1:${port}`,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: `bun run build && bun run start -- --hostname 127.0.0.1 --port ${port}`,
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
