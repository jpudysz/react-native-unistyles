import { NativeModules } from 'react-native'

type CxxUnistylesNativeModule = {
    install(): void
}

type AllowedTypes = string | number | boolean | null | undefined
type Theme = {
    [key: string]: AllowedTypes | Array<AllowedTypes> | Theme
}

type GlobalUnistyles = {
    addTheme(name: string): void,
    useTheme(name: string): void,
    addBreakpoints(breakpoints: Record<string, number>): void,
    getBreakpoints(): Record<string, number>,
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

class CxxUnistylesRuntime {
    private cxxUnistyles: GlobalUnistyles
    private themes: Record<string, Theme> = {}
    private breakpoints: Record<string, number> = {}

    constructor() {
        CxxUnistyles.install()

        // @ts-ignore
        // eslint-disable-next-line no-underscore-dangle
        this.cxxUnistyles = global.__UNISTYLES__ as GlobalUnistyles
    }

    public registerBreakpoints(breakpoints: Record<string, number>) {
        this.cxxUnistyles.addBreakpoints(breakpoints)
        this.breakpoints = breakpoints

        return this
    }

    public registerTheme(forName: string, theme: Theme) {
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

    public getBreakpoints() {
        return this.breakpoints
    }

    public getCurrentBreakpoint() {
        return this.cxxUnistyles.getCurrentBreakpoint()
    }

    public getCurrentTheme() {
        return this.cxxUnistyles.getCurrentTheme()
    }
}

export const UnistylesRuntime = new CxxUnistylesRuntime()
