import { screens } from '../consts'
import { THEME_NAMES, type ThemeName } from '../themes'
import type { ScenarioId } from './protocol'

export type Actions = {
    flip: (theme: ThemeName) => Promise<void>,
    followSystem: () => Promise<void>,
    // OS appearance via the host
    appearance: (scheme: 'light' | 'dark') => Promise<void>,
    back: () => Promise<void>,
    push: (href: string) => Promise<void>,
    // Runs a screen action registered with useE2EAction, the same code its buttons run
    act: (name: string, argument?: number | string) => Promise<void>,
    scroll: (target: string, y: number) => Promise<void>,
    // Runs a check registered with useE2EAction, it returns a failure or nothing
    expect: (name: string) => Promise<void>,
    expectNoOrphans: () => void,
    // Holds the probe strip still for the host's pixel check
    checkpoint: () => Promise<void>,
    theme: () => ThemeName,
    random: () => number,
    readonly pathname: string,
    readonly hasHost: boolean
}

// With --taps the host taps the theme pills and the back button in these scenarios
export const TAP_SCENARIOS: Array<ScenarioId> = ['tour', 'frozen-flip', 'mount-after-flip']

const SHOWCASE = screens.map(screen => `/${screen.route}`)

const pick = <T>(a: Actions, items: ReadonlyArray<T>) => items[Math.floor(a.random() * items.length)]!

const otherTheme = (a: Actions) => pick(a, THEME_NAMES.filter(theme => theme !== a.theme()))

// Every scenario starts on home, logged in, light theme, adaptive themes off and the original themes
export const scenarios: Record<ScenarioId, (a: Actions) => Promise<void>> = {
    // Every showcase screen goes through every theme
    'tour': async a => {
        for (const href of SHOWCASE) {
            await a.push(href)
            await a.flip('dark')
            await a.flip('premium')
            await a.flip('light')
            await a.back()
        }

        await a.checkpoint()
    },
    // #1192: toggles after a theme change request values React already rendered under the old theme
    'shared-dynamic-fn': async a => {
        await a.push('/dynamic-functions')
        await a.flip('dark')
        await a.act('chips.toggle', 0)
        await a.act('chips.toggle', 1)
        await a.act('chips.count')
        await a.flip('light')
        await a.act('chips.toggle', 0)
        await a.flip('premium')
        await a.act('chips.toggle', 1)
        await a.act('chips.toggle', 2)
        await a.flip('dark')
        await a.act('chips.toggle', 2)
        await a.back()
        await a.checkpoint()
    },
    // #1262: frozen steps re-link with the arguments of the last caller of the shared dynamic functions
    'frozen-stack': async a => {
        await a.push('/session')
        await a.push('/session/step-2')
        await a.push('/session/step-3')
        await a.back()
        await a.back()
        await a.push('/session/step-2')
        await a.push('/session/step-3')
        await a.flip('dark')
        await a.back()
        await a.back()
        // a fresh step reads the StyleSheet cache, the re-links above must not mark it fresh (a8d51464)
        await a.push('/session/step-2')
        await a.flip('light')
        await a.back()
        await a.back()
        await a.checkpoint()
    },
    // Theme changes while home is frozen, home comes back with the new theme
    'frozen-flip': async a => {
        await a.push('/basics')
        await a.flip('dark')
        await a.back()
        await a.flip('premium')
        await a.push('/variants')
        await a.push('/dynamic-functions')
        await a.flip('light')
        await a.back()
        await a.back()
        await a.checkpoint()
    },
    // #1260: Suspense hides content and restores it, with theme changes in between
    'suspense': async a => {
        await a.push('/suspense')
        await a.act('suspense.suspend')
        await a.act('suspense.resume')
        await a.act('suspense.suspend')
        await a.flip('dark')
        await a.act('suspense.resume')
        await a.act('suspense.suspend')
        await a.flip('premium')
        await a.flip('light')
        await a.act('suspense.resume')
        await a.back()
        await a.checkpoint()
    },
    // <Activity> keeps rendering hidden content, theme changes and new arguments land while it's hidden
    'activity': async a => {
        await a.push('/activity')
        await a.act('activity.toggle')
        await a.flip('dark')
        await a.act('activity.toggle')
        await a.act('activity.toggle')
        await a.act('activity.bump')
        await a.flip('premium')
        await a.act('activity.bump')
        await a.act('activity.toggle')
        await a.act('activity.toggle')
        await a.flip('light')
        await a.act('activity.bump')
        await a.act('activity.toggle')
        await a.back()
        await a.checkpoint()
    },
    // #1252: restoring a big frozen screen, with and without a theme change while it's frozen
    'frozen-list': async a => {
        await a.push('/frozen-list')
        await a.push('/basics')
        await a.push('/variants')
        await a.act('frozen-list.watch')
        await a.back()
        await a.expect('frozen-list.stall')
        await a.push('/variants')
        await a.flip('dark')
        await a.act('frozen-list.watch')
        await a.back()
        await a.expect('frozen-list.stall')
        await a.back()
        await a.flip('light')
        await a.back()
        await a.checkpoint()
    },
    // #1217 / #1179: log out while steps are frozen, free their families, log in and change the theme
    'frozen-unmount': async a => {
        await a.push('/session')
        await a.push('/session/step-2')
        await a.push('/session/step-3')
        await a.back()
        await a.back()
        await a.push('/session/step-2')
        await a.push('/session/step-3')
        await a.act('session.log-out')
        await a.act('session.churn')
        await a.act('session.log-in')
        await a.push('/session/step-2')
        await a.push('/session/step-3')
        await a.back()
        await a.back()
        await a.flip('dark')
        a.expectNoOrphans()
        await a.flip('light')
        await a.back()
        await a.checkpoint()
    },
    'scoped': async a => {
        await a.push('/scoped-theme')
        await a.flip('dark')
        await a.act('scoped.mount')
        await a.flip('premium')
        await a.followSystem()
        await a.act('scoped.mount')
        await a.act('scoped.mount')
        await a.flip('light')
        await a.back()
        await a.checkpoint()
    },
    'variants-after-flip': async a => {
        await a.push('/variants')
        await a.flip('dark')
        await a.act('variants.size')
        await a.act('variants.color')
        await a.flip('premium')
        await a.act('variants.outline')
        await a.act('variants.color')
        await a.act('variants.color')
        await a.act('variants.size')
        await a.act('variants.size')
        await a.flip('light')
        await a.act('variants.outline')
        await a.back()
        await a.checkpoint()
    },
    // Screens mounted into a theme that changed after their StyleSheets were created
    'mount-after-flip': async a => {
        await a.flip('dark')
        await a.push('/basics')
        await a.act('basics.toggle')
        await a.back()
        await a.push('/lists')
        await a.scroll('lists', 1200)
        await a.back()
        await a.flip('premium')
        await a.push('/with-unistyles')
        await a.act('with-unistyles.toggle')
        await a.back()
        await a.push('/animations')
        await a.act('animations.move')
        await a.back()
        await a.checkpoint()
    },
    'set-theme-on-mount': async a => {
        await a.push('/mount-theme?theme=dark')
        await a.back()
        await a.push('/mount-theme?theme=premium')
        await a.back()
        await a.checkpoint()
    },
    'update-theme': async a => {
        await a.push('/runtime')
        await a.act('runtime.shuffle')
        await a.flip('dark')
        await a.act('runtime.shuffle')
        await a.act('runtime.shuffle')
        await a.flip('light')
        await a.act('runtime.restore')
        await a.back()
        await a.checkpoint()
    },
    // Unistyles commits while React yields in a transition render, React's new props must survive them
    'transition': async a => {
        await a.push('/transition')
        await a.act('transition.resize')
        await a.expect('transition.check')
        await a.act('transition.resize', 'quiet')
        await a.expect('transition.check')
        await a.act('transition.resize', 'quiet')
        await a.expect('transition.check')
        await a.act('transition.resize', 'flip')
        await a.expect('transition.check')
        await a.flip('light')
        await a.act('transition.resize', 'quiet')
        await a.expect('transition.check')
        await a.back()
        await a.checkpoint()
    },
    // Virtualized rows mounted after a theme change
    'lists-scroll': async a => {
        await a.push('/lists')
        await a.scroll('lists', 800)
        await a.flip('dark')
        await a.scroll('lists', 2000)
        await a.flip('premium')
        await a.scroll('lists', 0)
        await a.flip('light')
        await a.back()
        await a.checkpoint()
    },
    // Needs the host to flip the OS appearance
    'os-appearance': async a => {
        if (!a.hasHost) {
            return
        }

        await a.followSystem()

        const first = a.theme() === 'dark' ? 'light' : 'dark'
        const second = first === 'dark' ? 'light' : 'dark'

        await a.appearance(first)
        await a.push('/scoped-theme')
        await a.appearance(second)
        await a.back()
        await a.push('/basics')
        await a.appearance(first)
        await a.back()
        await a.checkpoint()
    },
    // Seeded combinations of flips, pushes, backs and screen actions
    'random-walk': async a => {
        let depth = 0

        for (let step = 0; step < 14; step++) {
            const roll = a.random()

            if (roll < 0.35) {
                await a.flip(otherTheme(a))
            } else if (roll < 0.6 && depth < 3) {
                await a.push(pick(a, SHOWCASE.filter(href => href !== a.pathname)))
                depth++
            } else if (roll < 0.8 && depth > 0) {
                await a.back()
                depth--
            } else if (a.pathname === '/dynamic-functions') {
                await a.act('chips.toggle', Math.floor(a.random() * 4))
            } else if (a.pathname === '/lists') {
                await a.scroll('lists', Math.floor(a.random() * 2400))
            } else if (a.pathname === '/variants') {
                await a.act(pick(a, ['variants.size', 'variants.color', 'variants.outline']))
            } else {
                await a.flip(otherTheme(a))
            }
        }

        while (depth > 0) {
            await a.back()
            depth--
        }

        await a.checkpoint()
    }
}
