import React, {
    useContext,
    useEffect,
    useReducer,
    type ComponentProps,
    type ComponentRef,
    type ComponentType,
    type Ref,
} from 'react'

import type { UnistylesValues } from '../../types'
import type { Mappings } from './types'

import { ScopedThemeContext } from '../../components/ScopedThemeContext'
import { UnistyleDependency, UnistylesShadowRegistry } from '../../specs'
import { deepMergeObjects, isAnimatedStyleHandle } from '../../utils'
import { TRACK_DEPENDENCIES } from '../trackDependencies'
import { useProxifiedUnistyles } from '../useProxifiedUnistyles'
import { listener } from '../useProxifiedUnistyles/listener'
import { maybeWarnAboutMultipleUnistyles } from '../warn'

// @ts-expect-error
type GenericComponentProps<P> = ComponentProps<P>
// @ts-expect-error
type GenericComponentRef<T> = ComponentRef<T>

type UnistylesSecrets = {
    uni__getStyles: () => Record<string, any>
    uni__dependencies: Array<UnistyleDependency>
}

type MappedSecrets = {
    styles: Record<string, any> | Array<Record<string, any>>
    dependencies: Array<UnistyleDependency>
}

// Reanimated finds animated styles by their keys, merged with other styles they would hide them
// so keep every animated style as a separate entry and merge only the styles between them, in order
const mergeAroundAnimatedStyles = (secrets: Array<UnistylesSecrets>) =>
    secrets.reduce<Array<Record<string, any>>>((acc, secret) => {
        const style = secret.uni__getStyles()
        const lastStyle = acc.at(-1)

        if (isAnimatedStyleHandle(style)) {
            return acc.concat([style])
        }

        if (lastStyle && !isAnimatedStyleHandle(lastStyle)) {
            Object.assign(lastStyle, style)

            return acc
        }

        return acc.concat([{ ...style }])
    }, [])

export const getSecrets = (styleProps: Record<string, any> = {}): MappedSecrets => {
    const styles = Array.isArray(styleProps) ? styleProps.flat(Infinity) : [styleProps]

    const secrets: Array<UnistylesSecrets> = styles.filter(Boolean).reduce((acc, style) => {
        const unistyleKey = Object.keys(style).find((key) => key.startsWith('unistyles_'))

        return acc.concat([
            unistyleKey
                ? style[unistyleKey]
                : {
                      uni__getStyles: () => style,
                      uni__dependencies: [],
                  },
        ])
    }, [])

    return {
        styles: styles.some(isAnimatedStyleHandle)
            ? mergeAroundAnimatedStyles(secrets)
            : secrets.reduce((acc, secret) => Object.assign(acc, secret.uni__getStyles()), {} as Record<string, any>),
        dependencies: secrets.flatMap((secret) => secret.uni__dependencies),
    }
}

// undefined when it can't be compared (eg. a circular value), then it always counts as changed
const serializeStyles = (styles: unknown) => {
    try {
        return JSON.stringify(styles)
    } catch {
        return undefined
    }
}

// without the Babel plugin, a style depends on everything its StyleSheet read, so re-render only when it changed
// the component re-renders for theme changes anyway
export const listenToStyleChanges = (
    dependencies: Array<UnistyleDependency>,
    getStyles: () => unknown,
    onChange: VoidFunction,
) => {
    let lastStyles = serializeStyles(getStyles())

    return listener({
        dependencies: dependencies.filter((dependency) => dependency !== UnistyleDependency.Theme),
        updateTheme: () => {},
        updateRuntime: () => {
            const styles = serializeStyles(getStyles())

            if (styles === undefined || styles !== lastStyles) {
                lastStyles = styles
                onChange()
            }
        },
    })
}

export const withUnistyles = <TComponent, TMappings extends GenericComponentProps<TComponent>>(
    Component: TComponent,
    mappings?: Mappings<TMappings>,
) => {
    type TProps = GenericComponentProps<TComponent>
    type PropsWithUnistyles = Partial<TProps> & {
        uniProps?: Mappings<TProps>
    }
    type UnistyleStyles = {
        style?: UnistylesValues
        contentContainerStyle?: UnistylesValues
    }

    return ({ ref, ...props }: PropsWithUnistyles & { ref?: Ref<GenericComponentRef<TComponent>> }) => {
        const narrowedProps = props as PropsWithUnistyles & UnistyleStyles
        const NativeComponent = Component as ComponentType

        // @ts-ignore we don't know the type of the component
        // prettier-ignore
        maybeWarnAboutMultipleUnistyles(narrowedProps.style, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)
        // @ts-ignore we don't know the type of the component
        // prettier-ignore
        maybeWarnAboutMultipleUnistyles(narrowedProps.contentContainerStyle, `withUnistyles(${Component.displayName ?? Component.name ?? 'Unknown'})`)

        const scope = useContext(ScopedThemeContext)
        const { proxifiedRuntime, proxifiedTheme, addDependencies } = useProxifiedUnistyles()

        // Always track Theme dependency — accessing any property on proxifiedTheme
        // triggers the Proxy get trap which adds Theme to the dependency Set
        void (proxifiedTheme as Record<string, unknown>).__uni

        const [, stylesChanged] = useReducer(() => ({}), {})

        const getScopedSecrets = () => {
            const previousScopedTheme = scope ? UnistylesShadowRegistry.getScopedTheme() : undefined

            if (scope) {
                UnistylesShadowRegistry.setScopedTheme(scope.name)
            }

            const styleSecrets = getSecrets(narrowedProps.style)
            const contentContainerStyleSecrets = getSecrets(narrowedProps.contentContainerStyle)

            if (scope) {
                UnistylesShadowRegistry.setScopedTheme(previousScopedTheme)
            }

            return { styleSecrets, contentContainerStyleSecrets }
        }

        useEffect(() => {
            const styleSecrets = getSecrets(narrowedProps.style)
            const contentContainerStyleSecrets = getSecrets(narrowedProps.contentContainerStyle)
            const dependencies = Array.from(
                new Set([...styleSecrets.dependencies, ...contentContainerStyleSecrets.dependencies]),
            )

            if (!TRACK_DEPENDENCIES) {
                addDependencies(dependencies)

                return
            }

            return listenToStyleChanges(
                dependencies,
                () => {
                    const secrets = getScopedSecrets()

                    return [secrets.styleSecrets.styles, secrets.contentContainerStyleSecrets.styles]
                },
                stylesChanged,
            )
        }, [narrowedProps.style, narrowedProps.contentContainerStyle])

        const { key: mappingsKey, ...mappingsProps } = mappings ? mappings(proxifiedTheme, proxifiedRuntime) : {}
        const { key: uniPropsKey, ...unistyleProps } = narrowedProps.uniProps
            ? narrowedProps.uniProps(proxifiedTheme, proxifiedRuntime)
            : {}

        const { styleSecrets, contentContainerStyleSecrets } = getScopedSecrets()

        const finalProps = {
            ...deepMergeObjects(mappingsProps, unistyleProps, props),
            ...(narrowedProps.style
                ? {
                      style: styleSecrets.styles,
                  }
                : {}),
            ...(narrowedProps.contentContainerStyle
                ? {
                      contentContainerStyle: contentContainerStyleSecrets.styles,
                  }
                : {}),
        } as any

        return <NativeComponent key={uniPropsKey || mappingsKey} {...finalProps} ref={ref} />
    }
}
