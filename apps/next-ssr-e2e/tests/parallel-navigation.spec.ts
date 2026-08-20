import { expect, test, type Page } from '@playwright/test'

type StyleAudit = {
    backgroundColor: string
    classNames: string[]
    missingClasses: string[]
}

const auditStyles = (page: Page, testId: string) =>
    page.getByTestId(testId).evaluate(element => {
        const classNames = Array.from(element.classList).filter(className => className.startsWith('unistyles_'))
        const cssText = Array.from(document.styleSheets)
            .map(styleSheet => {
                try {
                    return Array.from(styleSheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n')
                } catch {
                    return ''
                }
            })
            .join('\n')

        return {
            backgroundColor: getComputedStyle(element).backgroundColor,
            classNames,
            missingClasses: classNames.filter(className => !cssText.includes(`.${className}`)),
        } satisfies StyleAudit
    })

const readUnistylesStyleResources = (page: Page) =>
    page.locator('style[data-precedence="unistyles"]').evaluateAll((styleElements) =>
        styleElements.flatMap((styleElement) => styleElement.getAttribute('data-href')?.split(' ') ?? []),
    )

const readMissingUnistylesClasses = (page: Page) =>
    page.evaluate(() => {
        const classNames = Array.from(document.querySelectorAll('[class*="unistyles_"]')).flatMap((element) =>
            Array.from(element.classList).filter((className) => className.startsWith('unistyles_')),
        )
        const cssText = Array.from(document.styleSheets)
            .flatMap((styleSheet) => {
                try {
                    return Array.from(styleSheet.cssRules).map((rule) => rule.cssText)
                } catch {
                    return []
                }
            })
            .join('\n')

        return Array.from(new Set(classNames)).filter((className) => !cssText.includes(`.${className}`))
    })

const hasStableStylesheetOrder = (page: Page) =>
    page.evaluate(() => {
        const headChildren = Array.from(document.head.children)
        const rnwStyle = document.getElementById('react-native-stylesheet')
        const serverRNWStyle = document.getElementById('rnw-style')
        const anchor = document.getElementById('unistyles-resource-anchor')
        const runtimeStyle = document.getElementById('unistyles-web')
        const resources = Array.from(
            document.head.querySelectorAll('style[data-precedence="unistyles"],link[data-precedence="unistyles"]'),
        ).filter(resource => resource !== anchor)
        const rnwIndex = rnwStyle ? headChildren.indexOf(rnwStyle) : -1
        const anchorIndex = anchor ? headChildren.indexOf(anchor) : -1
        const runtimeIndex = runtimeStyle ? headChildren.indexOf(runtimeStyle) : -1

        return (
            rnwIndex !== -1 &&
            resources.length > 0 &&
            serverRNWStyle?.textContent?.startsWith('@layer react-native-unistyles-rnw{') === true &&
            resources.every(resource => {
                const resourceIndex = headChildren.indexOf(resource)

                return rnwIndex < resourceIndex && resourceIndex < runtimeIndex
            }) &&
            rnwIndex < anchorIndex &&
            anchorIndex < runtimeIndex
        )
    })

test('keeps server-generated styles across parallel route navigation', async ({ page }) => {
    const pageErrors: Array<string> = []

    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.goto('/source')

    await expect(page.getByTestId('source-card')).toBeVisible()
    await expect(auditStyles(page, 'source-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(18, 52, 86)',
        missingClasses: [],
    })
    await expect(page.getByTestId('source-card')).toHaveCSS('flex-direction', 'row')
    await expect(page.getByTestId('source-label')).toHaveCSS('color', 'rgb(254, 220, 186)')
    await expect(hasStableStylesheetOrder(page)).resolves.toBe(true)

    await page.getByRole('link', { name: 'Open destination route' }).click()

    await expect(page).toHaveURL('/destination')
    await expect(page.getByTestId('destination-card')).toBeVisible()
    await expect(auditStyles(page, 'destination-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(101, 67, 33)',
        missingClasses: [],
    })
    await expect(page.getByTestId('destination-card')).toHaveCSS('flex-direction', 'row')
    await expect(page.getByTestId('late-card')).toBeVisible()
    await expect(auditStyles(page, 'late-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(36, 104, 19)',
        missingClasses: [],
    })
    await expect(auditStyles(page, 'late-image')).resolves.toMatchObject({
        backgroundColor: 'rgb(171, 205, 239)',
        missingClasses: [],
    })
    await expect(page.getByTestId('late-image')).toHaveCSS('overflow', 'visible')
    await expect(page.getByTestId('late-image')).toHaveCSS('z-index', '7')
    await expect(auditStyles(page, 'late-pressable')).resolves.toMatchObject({
        backgroundColor: 'rgb(118, 84, 50)',
        missingClasses: [],
    })
    await expect(auditStyles(page, 'client-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(17, 34, 51)',
        missingClasses: [],
    })
    await expect(hasStableStylesheetOrder(page)).resolves.toBe(true)
    const clientClassNames = await page.getByTestId('client-card').evaluate((element) =>
        Array.from(element.classList).filter((className) => className.startsWith('unistyles_')),
    )
    const serverResourceCSS = await page
        .locator('style[data-precedence="unistyles"]')
        .evaluateAll((styleElements) => styleElements.map((styleElement) => styleElement.textContent ?? '').join('\n'))

    expect(clientClassNames.every((className) => !serverResourceCSS.includes(`.${className}`))).toBe(true)
    await expect(page.getByTestId('late-scroll').locator(':scope > div')).toHaveCSS(
        'background-color',
        'rgb(53, 121, 36)',
    )
    await expect(readMissingUnistylesClasses(page)).resolves.toEqual([])
    const destinationStyleResources = await readUnistylesStyleResources(page)

    await page.getByRole('link', { name: 'Open source route' }).click()

    await expect(page).toHaveURL('/source')
    await expect(auditStyles(page, 'source-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(18, 52, 86)',
        missingClasses: [],
    })
    await expect(page.getByTestId('source-card')).toHaveCSS('flex-direction', 'row')

    const routeStyleResources = await readUnistylesStyleResources(page)

    expect(routeStyleResources.length).toBeGreaterThan(0)
    expect(routeStyleResources.every((href) => href.startsWith('unistyles:'))).toBe(true)
    expect(new Set(routeStyleResources).size).toBe(routeStyleResources.length)
    expect(routeStyleResources.sort()).toEqual(destinationStyleResources.sort())
    expect(pageErrors).toEqual([])
})

test('includes destination server styles on a hard reload', async ({ page }) => {
    await page.goto('/destination')

    await expect(page.getByTestId('destination-card')).toBeVisible()
    await expect(auditStyles(page, 'destination-card')).resolves.toMatchObject({
        backgroundColor: 'rgb(101, 67, 33)',
        missingClasses: [],
    })
    await expect(page.getByTestId('destination-card')).toHaveCSS('flex-direction', 'row')
    await expect(hasStableStylesheetOrder(page)).resolves.toBe(true)
})

test('runtime theme updates override a persisted RSC stylesheet resource', async ({ page }) => {
    await page.goto('/cascade')

    const serverCard = page.getByTestId('cascade-server-card')
    const clientCard = page.getByTestId('cascade-client-card')

    await expect(serverCard).toHaveCSS('background-color', 'rgb(194, 65, 12)')
    await expect(clientCard).toHaveCSS('background-color', 'rgb(194, 65, 12)')
    await expect(serverCard).toHaveCSS('border-radius', '27px')
    await expect(clientCard).toHaveCSS('border-radius', '27px')
    await expect(serverCard).toHaveClass(/\bauthor-cascade-override\b/)
    await expect(clientCard).toHaveClass(/\bauthor-cascade-override\b/)

    const sharedClassName = await serverCard.evaluate(element =>
        Array.from(element.classList).find(className => className.startsWith('unistyles_')),
    )

    if (!sharedClassName) {
        throw new Error('Expected the server card to have a Unistyles class')
    }

    await expect(clientCard).toHaveClass(new RegExp(`\\b${sharedClassName}\\b`))

    const initialResourceCSS = await page
        .locator('style[data-precedence="unistyles"]')
        .evaluateAll(styleElements => styleElements.map(styleElement => styleElement.textContent ?? '').join('\n'))

    expect(initialResourceCSS).toContain(`.${sharedClassName}`)
    expect(initialResourceCSS).toContain('background-color:#c2410c')

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()

    await expect(serverCard).toHaveCSS('background-color', 'rgb(14, 116, 144)')
    await expect(clientCard).toHaveCSS('background-color', 'rgb(14, 116, 144)')
    await expect(serverCard).toHaveCSS('border-radius', '27px')
    await expect(clientCard).toHaveCSS('border-radius', '27px')

    const cascadeState = await page.evaluate(className => {
        const runtimeStyle = document.querySelector<HTMLStyleElement>('style#unistyles-web')
        const resources = Array.from(
            document.head.querySelectorAll<HTMLStyleElement | HTMLLinkElement>(
                'style[data-precedence="unistyles"],link[data-precedence="unistyles"]',
            ),
        )
        const headChildren = Array.from(document.head.children)
        const runtimeIndex = runtimeStyle ? headChildren.indexOf(runtimeStyle) : -1

        return {
            resourceStillHasLightRule: resources.some(
                resource =>
                    resource.textContent?.includes(`.${className}`) &&
                    resource.textContent.includes('background-color:#c2410c'),
            ),
            runtimeAfterResources:
                runtimeIndex !== -1 && resources.every(resource => headChildren.indexOf(resource) < runtimeIndex),
            runtimeHasDarkRule:
                runtimeStyle?.textContent?.includes(`.${className}`) === true &&
                runtimeStyle.textContent.includes('background-color:#0e7490'),
        }
    }, sharedClassName)

    expect(cascadeState).toEqual({
        resourceStillHasLightRule: true,
        runtimeAfterResources: true,
        runtimeHasDarkRule: true,
    })
})

test('a late RSC stylesheet resource stays behind an existing runtime theme rule', async ({ page }) => {
    await page.goto('/cascade/client')

    const clientCard = page.getByTestId('late-resource-client-card')

    await expect(clientCard).toHaveCSS('background-color', 'rgb(194, 65, 12)')

    const sharedClassName = await clientCard.evaluate(element =>
        Array.from(element.classList).find(className => className.startsWith('unistyles_')),
    )

    if (!sharedClassName) {
        throw new Error('Expected the client card to have a Unistyles class')
    }

    const initialResourceCSS = await page
        .locator('style[data-precedence="unistyles"]')
        .evaluateAll(styleElements => styleElements.map(styleElement => styleElement.textContent ?? '').join('\n'))

    expect(initialResourceCSS).not.toContain(`.${sharedClassName}`)

    await page.getByRole('button', { name: 'Switch to dark before navigation' }).click()
    await expect(clientCard).toHaveCSS('background-color', 'rgb(14, 116, 144)')

    await page.getByRole('link', { name: 'Open late RSC resource' }).click()

    await expect(page).toHaveURL('/cascade/server')

    const serverCard = page.getByTestId('late-resource-server-card')

    await expect(serverCard).toHaveClass(new RegExp(`\\b${sharedClassName}\\b`))
    await expect(serverCard).toHaveCSS('background-color', 'rgb(14, 116, 144)')

    const lateResourceState = await page.evaluate(className => {
        const runtimeStyle = document.querySelector<HTMLStyleElement>('style#unistyles-web')
        const resources = Array.from(
            document.head.querySelectorAll<HTMLStyleElement | HTMLLinkElement>(
                'style[data-precedence="unistyles"],link[data-precedence="unistyles"]',
            ),
        )
        const headChildren = Array.from(document.head.children)
        const runtimeIndex = runtimeStyle ? headChildren.indexOf(runtimeStyle) : -1

        return {
            lateResourceHasLightRule: resources.some(
                resource =>
                    resource.textContent?.includes(`.${className}`) &&
                    resource.textContent.includes('background-color:#c2410c'),
            ),
            runtimeAfterResources:
                runtimeIndex !== -1 && resources.every(resource => headChildren.indexOf(resource) < runtimeIndex),
            runtimeHasDarkRule:
                runtimeStyle?.textContent?.includes(`.${className}`) === true &&
                runtimeStyle.textContent.includes('background-color:#0e7490'),
        }
    }, sharedClassName)

    expect(lateResourceState).toEqual({
        lateResourceHasLightRule: true,
        runtimeAfterResources: true,
        runtimeHasDarkRule: true,
    })
})

test('isolates styles between concurrent server renders', async ({ request }) => {
    const slowResponsePromise = request.get('/concurrent/slow')

    await new Promise(resolve => setTimeout(resolve, 30))

    const [slowResponse, fastResponse] = await Promise.all([slowResponsePromise, request.get('/concurrent/fast')])
    const [slowHTML, fastHTML] = await Promise.all([slowResponse.text(), fastResponse.text()])
    const slowClassName = slowHTML.match(/data-class="(unistyles_[^"]+)"/)?.[1]
    const fastClassName = fastHTML.match(/data-class="(unistyles_[^"]+)"/)?.[1]

    expect(slowResponse.ok()).toBe(true)
    expect(fastResponse.ok()).toBe(true)
    expect(slowClassName).toBeTruthy()
    expect(fastClassName).toBeTruthy()
    expect(slowHTML).toContain(`.${slowClassName}{`)
    expect(slowHTML).not.toContain(`.${fastClassName}{`)
    expect(fastHTML).toContain(`.${fastClassName}{`)
    expect(fastHTML).not.toContain(`.${slowClassName}{`)
})
