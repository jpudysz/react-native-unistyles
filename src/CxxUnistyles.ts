import { NativeModules } from 'react-native'

type CxxUnistylesNativeModule = {
    install(): void
}

type AllowedTypes = string | number | boolean | null | undefined
type Theme = {
    [key: string]: AllowedTypes | Array<AllowedTypes> | Theme
}

type GlobalUnistyles = {
    addTheme(name: string, theme: Theme): void,
    addBreakpoints(breakpoints: Record<string, number>): void,
    getBreakpoints(): Record<string, number>,
    getCurrentBreakpoint(): string | undefined
}

const CxxUnistyles = NativeModules.Unistyles as CxxUnistylesNativeModule

CxxUnistyles.install()

class CxxUnistylesRuntime {
    private cxxUnistyles: GlobalUnistyles

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

    public registerTheme(forName: string, theme: Theme) {
        this.cxxUnistyles.addTheme(forName, theme)

        return this
    }

    public getBreakpoints() {
        return this.cxxUnistyles.getBreakpoints()
    }

    public getCurrentBreakpoint() {
        return this.cxxUnistyles.getCurrentBreakpoint()
    }
}

export const UnistylesRuntime = new CxxUnistylesRuntime()
