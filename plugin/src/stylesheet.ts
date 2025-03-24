import type { NodePath } from '@babel/core'
import * as t from '@babel/types'
import type { UnistylesPluginPass } from './types'

type Styles = {
    [key: string]: string[]
}

type Props = {
    properties: string[]
    parent?: string
}

const UnistyleDependency = {
    Theme: 0,
    ThemeName: 1,
    AdaptiveThemes: 2,
    Breakpoints: 3,
    Variants: 4,
    ColorScheme: 5,
    Dimensions: 6,
    Orientation: 7,
    ContentSizeCategory: 8,
    Insets: 9,
    PixelRatio: 10,
    FontScale: 11,
    StatusBar: 12,
    NavigationBar: 13,
    Ime: 14
}

function getProperty(property: t.ObjectProperty | t.RestElement): Props | undefined {
    if (!property) {
        return undefined
    }

    if (t.isIdentifier(property)) {
        const prop = (property as t.Identifier)

        return {
            properties: [prop.name]
        }
    }

    if (t.isObjectPattern(property)) {
        const prop = property as t.ObjectPattern
        const matchingProperties = prop.properties.flatMap(p => getProperty(p))

        return {
            properties: matchingProperties.flatMap(properties => properties?.properties).filter((prop): prop is string => prop !== undefined)
        }
    }

    if (t.isObjectProperty(property) && t.isIdentifier(property.value)) {
        const prop = property.key as t.Identifier

        return {
            properties: [prop.name]
        }
    }

    if (t.isObjectProperty(property) && t.isObjectPattern(property.value)) {
        const matchingProperties = property.value.properties.flatMap(p => getProperty(p))
        const prop = property.key as t.Identifier

        return {
            parent: prop.name,
            properties: matchingProperties.flatMap(properties => properties?.properties).filter((prop): prop is string => prop !== undefined)
        }
    }

    return undefined
}

function toUnistylesDependency(dependency: string) {
    // breakpoints are too complex and are handled by C++
    switch (dependency) {
        case 'theme': {
            return UnistyleDependency.Theme
        }
        case 'themeName': {
            return UnistyleDependency.ThemeName
        }
        case 'adaptiveThemes': {
            return UnistyleDependency.AdaptiveThemes
        }
        case 'breakpoint': {
            return UnistyleDependency.Breakpoints
        }
        case 'colorScheme': {
            return UnistyleDependency.ColorScheme
        }
        case 'screen': {
            return UnistyleDependency.Dimensions
        }
        case 'isPortrait':
        case 'isLandscape': {
            return UnistyleDependency.Orientation
        }
        case 'contentSizeCategory': {
            return UnistyleDependency.ContentSizeCategory
        }
        case 'ime': {
            return UnistyleDependency.Ime
        }
        case 'insets': {
            return UnistyleDependency.Insets
        }
        case 'pixelRatio': {
            return UnistyleDependency.PixelRatio
        }
        case 'fontScale': {
            return UnistyleDependency.FontScale
        }
        case 'statusBar': {
            return UnistyleDependency.StatusBar
        }
        case 'navigationBar': {
            return UnistyleDependency.NavigationBar
        }
        case 'variants': {
            return UnistyleDependency.Variants
        }
        default:
            return null
    }
}

function getReturnStatementsFromBody(node: t.BlockStatement | t.Statement, results: t.ReturnStatement[] = []) {
    if (t.isReturnStatement(node)) {
        results.push(node)
    }

    if (t.isBlockStatement(node)) {
        node.body.forEach(child => getReturnStatementsFromBody(child, results))
    }

    if (t.isIfStatement(node)) {
        getReturnStatementsFromBody(node.consequent, results)

        if (node.alternate) {
            getReturnStatementsFromBody(node.alternate, results)
        }
    }

    return results
}

function stringToUniqueId(str: string) {
    let hash = 0

    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i)
        hash |= 0
    }

    const absHash = Math.abs(hash)

    return absHash % 1000000000
}

export function isUnistylesStyleSheet(path: NodePath<t.CallExpression>, state: UnistylesPluginPass) {
    const { callee } = path.node

    if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
        return (
            callee.property.name === 'create' &&
            t.isIdentifier(callee.object) &&
            callee.object.name === state.file.styleSheetLocalName
        )
    }

    return false
}

export function isKindOfStyleSheet(path: NodePath<t.CallExpression>, state: UnistylesPluginPass) {
    if (!state.file.forceProcessing && !state.file.hasUnistylesImport) {
        return false
    }

    const { callee } = path.node

    return (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.property) &&
        callee.property.name === 'create' &&
        t.isIdentifier(callee.object)
    )
}

export function addStyleSheetTag(path: NodePath<t.CallExpression>, state: UnistylesPluginPass) {
    const str = state.filename?.replace(state.cwd, '') ?? ''
    const uniqueId = stringToUniqueId(str) + ++state.file.tagNumber

    path.node.arguments.push(t.numericLiteral(uniqueId))
}

export function getStylesDependenciesFromObject(path: NodePath<t.CallExpression>) {
    const detectedStylesWithVariants = new Set<{ label: string, key: string }>()
    const stylesheet = path.node.arguments[0]

    if (t.isObjectExpression(stylesheet)) {
        stylesheet?.properties.forEach(property => {
            if (!t.isObjectProperty(property) || !t.isIdentifier(property.key)) {
                return
            }

            if (t.isObjectProperty(property)) {
                if (t.isObjectExpression(property.value)) {
                    property.value.properties.forEach(innerProp => {
                        if (t.isObjectProperty(innerProp) && t.isIdentifier(innerProp.key) && t.isIdentifier(property.key) && innerProp.key.name === 'variants') {
                            detectedStylesWithVariants.add({
                                label: 'variants',
                                key: property.key.name
                            })
                        }
                    })

                }
            }

            if (t.isArrowFunctionExpression(property.value)) {
                if (t.isObjectExpression(property.value.body)) {
                    property.value.body.properties.forEach(innerProp => {
                        if (t.isObjectProperty(innerProp) && t.isIdentifier(innerProp.key) && t.isIdentifier(property.key) && innerProp.key.name === 'variants') {
                            detectedStylesWithVariants.add({
                                label: 'variants',
                                key: property.key.name
                            })
                        }
                    })

                }
            }
        })
    }

    const variants = Array.from(detectedStylesWithVariants)

    return variants.reduce<Styles>((acc, { key, label }) => {
        if (acc[key]) {
            acc[key] = [
                ...acc[key],
                label
            ]

            return acc
        }

        acc[key] = [label]

        return acc
    }, {})
}

export function getStylesDependenciesFromFunction(funcPath: NodePath<t.Node> | Array<NodePath<t.Node>>) {
    if (!funcPath) {
        return
    }

    if (Array.isArray(funcPath)) {
        return
    }

    if (!t.isFunctionExpression(funcPath.node) && !t.isArrowFunctionExpression(funcPath.node)) {
        return
    }

    const params = funcPath.node.params
    const [themeParam, rtParam] = params

    const themeNames: Props[] = []

    // destructured theme object
    if (t.isObjectPattern(themeParam)) {
        // If destructured, collect all property names
        for (const prop of themeParam.properties) {
            const property = getProperty(prop)

            if (property) {
                themeNames.push(property)
            }
        }
    }

    // user used 'theme' without destructuring
    if (t.isIdentifier(themeParam)) {
        themeNames.push({
            properties: [themeParam.name]
        })
    }

    const rtNames: Props[] = []

    // destructured rt object
    if (t.isObjectPattern(rtParam)) {
        // If destructured, collect all property names
        for (const prop of rtParam.properties) {
            const property = getProperty(prop)

            if (property) {
                rtNames.push(property)
            }
        }
    }

    // user used 'rt' without destructuring
    if (t.isIdentifier(rtParam)) {
        rtNames.push({
            properties: [rtParam.name]
        })
    }

    // get returned object or return statement from StyleSheet.create function
    let returnedObjectPath: NodePath<t.ObjectExpression> | null = null

    if (t.isObjectExpression(funcPath.node.body)) {
        returnedObjectPath = funcPath.get('body') as NodePath<t.ObjectExpression>
    } else {
        funcPath.traverse({
            ReturnStatement(retPath) {
                if (!returnedObjectPath && retPath.get('argument').isObjectExpression()) {
                    const argumentPath = retPath.get('argument')

                    if (argumentPath.isObjectExpression()) {
                        returnedObjectPath = argumentPath
                    }
                }
            }
        })
    }

    if (!returnedObjectPath) {
        // there is no returned object
        // abort

        return
    }

    const detectedStylesWithVariants = new Set<{ label: string, key: string }>()
    const properties = returnedObjectPath.get('properties') as NodePath[]

    // detect variants via Scope
    properties.forEach(propPath => {
        // get style name
        const stylePath = propPath.get('key')

        if (Array.isArray(stylePath)) {
            return
        }

        if (!stylePath.isIdentifier()) {
            return
        }

        const styleKey = stylePath.node.name
        const valuePath = propPath.get('value')

        if (Array.isArray(valuePath)) {
            return
        }

        if (valuePath.isObjectExpression()) {
            const hasVariants = valuePath.get('properties').some(innerProp => {
                const innerKey = innerProp.get('key')

                if (Array.isArray(innerKey)) {
                    return
                }

                return innerKey.isIdentifier() && innerKey.node.name === 'variants'
            })

            if (hasVariants) {
                detectedStylesWithVariants.add({
                    label: 'variants',
                    key: styleKey
                })
            }
        }

        if (valuePath.isArrowFunctionExpression()) {
            if (t.isObjectExpression(valuePath.node.body)) {
                const hasVariants = valuePath.node.body.properties.some(innerProp => {
                    return t.isObjectProperty(innerProp) && t.isIdentifier(innerProp.key) && innerProp.key.name === 'variants'
                })

                if (hasVariants) {
                    detectedStylesWithVariants.add({
                        label: 'variants',
                        key: styleKey
                    })
                }
            }
        }
    })

    const detectedStylesWithTheme = new Set<{ label: string, key: string }>()

    // detect theme dependencies via Scope
    themeNames.forEach(({ properties }) => {
        properties.forEach(property => {
            const binding = funcPath.scope.getBinding(property)

            if (!binding) {
                return
            }

            binding.referencePaths.forEach(refPath => {
                // find key of the style that we are referring to
                const containerProp = refPath
                    .findParent(parent => parent.isObjectProperty() && parent.parentPath === returnedObjectPath)

                if (!containerProp) {
                    return
                }

                const keyNode = containerProp.get('key')

                if (Array.isArray(keyNode)) {
                    return
                }

                const keyValue = keyNode.isLiteral()
                    ? (keyNode.isStringLiteral() || keyNode.isNumericLiteral() || keyNode.isBooleanLiteral())
                        ? String(keyNode.node.value)
                        : null
                    : null

                const styleKey = keyNode.isIdentifier()
                    ? keyNode.node.name
                    : keyValue

                if (styleKey) {
                    detectedStylesWithTheme.add({
                        label: 'theme',
                        key: styleKey
                    })
                }
            })
        })
    })

    const detectedStylesWithRt = new Set<{ label: string, key: string }>()
    const localRtName = t.isIdentifier(rtParam)
        ? rtParam.name
        : undefined

    // detect rt dependencies via Scope
    rtNames.forEach(({ properties, parent }) => {
        properties.forEach(property => {
            const rtBinding = funcPath.scope.getBinding(property)

            if (!rtBinding) {
                return
            }

            const isValidDependency = Boolean(toUnistylesDependency(property))

            let validRtName = property

            // user used nested destructing, find out parent key
            if (!isValidDependency && (!localRtName || (localRtName && localRtName !== property))) {
                if (!parent) {
                    return
                }

                if (!toUnistylesDependency(parent)) {
                    return
                }

                validRtName = parent
            }

            rtBinding.referencePaths.forEach(refPath => {
                // to detect rt dependencies we need to get parameter not rt itself
                // eg. rt.screen.width -> screen
                // rt.insets.top -> insets
                // special case: rt.insets.ime -> ime

                let usedLabel = validRtName

                if (refPath.parentPath?.isMemberExpression() && refPath.parentPath.get('object') === refPath) {
                    const memberExpr = refPath.parentPath
                    const propPath = memberExpr.get('property')

                    if (propPath.isIdentifier()) {
                        if (localRtName) {
                            usedLabel = propPath.node.name
                        }

                        if (
                            usedLabel === 'insets' &&
                            memberExpr.parentPath.isMemberExpression() &&
                            memberExpr.parentPath.get('object') === memberExpr
                        ) {
                            const secondPropPath = memberExpr.parentPath.get('property')

                            if (secondPropPath.isIdentifier() && secondPropPath.node.name === 'ime') {
                                usedLabel = 'ime'
                            }
                        }

                        if (
                            usedLabel === 'insets' &&
                            (memberExpr.parentPath.isBinaryExpression() || memberExpr.parentPath.isLogicalExpression())
                        ) {

                            const secondPropPath = memberExpr.node.property

                            if (t.isIdentifier(secondPropPath) && secondPropPath.name === 'ime') {
                                usedLabel = 'ime'
                            }
                        }
                    }
                }

                // find key of the style that we are referring to
                const containerProp = refPath
                    .findParent(parent => parent.isObjectProperty() && parent.parentPath === returnedObjectPath)

                if (!containerProp) {
                    return
                }

                const keyNode = containerProp.get('key')

                if (Array.isArray(keyNode)) {
                    return
                }

                const keyValue = keyNode.isLiteral()
                    ? (keyNode.isStringLiteral() || keyNode.isNumericLiteral() || keyNode.isBooleanLiteral())
                        ? String(keyNode.node.value)
                        : null
                    : null

                const styleKey = keyNode.isIdentifier()
                    ? keyNode.node.name
                    : keyValue

                if (styleKey) {
                    detectedStylesWithRt.add({
                        label: usedLabel,
                        key: styleKey
                    })
                }
            })
        })
    })

    const variants = Array.from(detectedStylesWithVariants)
    const theme = Array.from(detectedStylesWithTheme)
    const rt = Array.from(detectedStylesWithRt)

    return theme
        .concat(rt)
        .concat(variants)
        .reduce<Styles>((acc, { key, label }) => {
            if (acc[key]) {
                acc[key] = [
                    ...acc[key],
                    label,
                ]

                return acc
            }

            acc[key] = [label]

            return acc
        }, {})
}

export function addDependencies(state: UnistylesPluginPass, styleName: string, unistyle: t.ObjectProperty, detectedDependencies: string[]) {
    const debugMessage = (deps: (number | null)[]) => {
        if (state.opts.debug) {
            const mappedDeps = deps
                .map(dep => Object.keys(UnistyleDependency).find(key => UnistyleDependency[key as keyof typeof UnistyleDependency] === dep))
                .join(', ')

            console.log(`${state.filename?.replace(`${state.file.opts.root}/`, '')}: styles.${styleName}: [${mappedDeps}]`)
        }
    }

    const styleDependencies = detectedDependencies.map(toUnistylesDependency)

    // add metadata about dependencies
    if (styleDependencies.length > 0) {
        const uniqueDependencies = Array.from(new Set(styleDependencies))

        debugMessage(uniqueDependencies)

        let targets: t.ObjectExpression[] = []

        if (t.isArrowFunctionExpression(unistyle.value) || t.isFunctionExpression(unistyle.value)) {
            if (t.isObjectExpression(unistyle.value.body)) {
                targets.push(unistyle.value.body)
            }

            if (t.isBlockStatement(unistyle.value.body)) {
                targets = getReturnStatementsFromBody(unistyle.value.body)
                    .map(node => {
                        if (t.isIdentifier(node.argument)) {
                            node.argument = t.objectExpression([
                                t.spreadElement(node.argument)
                            ])
                        }

                        return node.argument
                    })
                    .filter((node): node is t.ObjectExpression => t.isObjectExpression(node))
            }
        }

        if (t.isObjectExpression(unistyle.value)) {
            targets.push(unistyle.value)
        }

        if (t.isMemberExpression(unistyle.value)) {
            // convert to object
            unistyle.value = t.objectExpression([t.spreadElement(unistyle.value)])

            targets.push(unistyle.value)
        }

        if (targets.length > 0) {
            targets.forEach(target => {
                target.properties.push(
                    t.objectProperty(
                        t.identifier('uni__dependencies'),
                        t.arrayExpression(uniqueDependencies.filter((dep): dep is number => dep !== undefined).map(dep => t.numericLiteral(dep)))
                    )
                )
            })
        }
    }
}
