import { NativeModules } from 'react-native'

type CxxUnistylesNativeModule = {
    install(): void
}

type GlobalUnistyles = {
    addTheme(name: string): void,
    useTheme(name: string): void,
    addBreakpoints(breakpoints: Record<string, number>): void,
    getBreakpointPairs(): Array<[string, number]>,
    getCurrentBreakpoint(): string | undefined,
    getCurrentTheme(): string | undefined,
}

export enum CxxUnistylesEventTypes {
    Theme = 'theme',
    Size = 'size'
}

export type CxxUnistylesThemeEvent = {
    type: CxxUnistylesEventTypes.Theme,
    payload: {
        currentTheme: string
    }
}

export type CxxUnistylesSizeEvent = {
    type: CxxUnistylesEventTypes.Size,
    payload: {
        width: number,
        height: number
    }
}

export type UnistylesEvents = CxxUnistylesThemeEvent | CxxUnistylesSizeEvent

const CxxUnistyles = NativeModules.Unistyles as CxxUnistylesNativeModule

CxxUnistyles.install()

class CxxUnistylesRuntime<T extends {}> {
    public themes: Record<string, T> = {}
    private cxxUnistyles: GlobalUnistyles
    private sortedBreakpointPairs: Array<[string, number]> | null = null

    constructor() {
        CxxUnistyles.install()

        // @ts-ignore
        // eslint-disable-next-line no-underscore-dangle
        this.cxxUnistyles = global.__UNISTYLES__ as GlobalUnistyles
    }

    public registerBreakpoints(breakpoints: Record<string, number>) {
        this.cxxUnistyles.addBreakpoints(breakpoints)

        return this
    }

    public registerTheme(forName: string, theme: T) {
        this.cxxUnistyles.addTheme(forName)
        this.themes[forName] = theme

        return this
    }

    public useTheme(forName: string): boolean {
        if (this.themes[forName]) {
            this.cxxUnistyles.useTheme(forName)

            return true
        }

        return false
    }

    public getBreakpointPairs() {
        if (this.sortedBreakpointPairs) {
            return this.sortedBreakpointPairs
        }

        const pairs = this.cxxUnistyles.getBreakpointPairs()

        this.sortedBreakpointPairs = pairs

        return pairs
    }

    public getCurrentBreakpoint() {
        return this.cxxUnistyles.getCurrentBreakpoint()
    }

    public getCurrentTheme() {
        return this.cxxUnistyles.getCurrentTheme()
    }
}

export const UnistylesRuntime = new CxxUnistylesRuntime()
