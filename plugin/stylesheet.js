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

function stringToUniqueId(str) {
    let hash = 0

    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i)
        hash |= 0
    }

    const absHash = Math.abs(hash)

    return absHash % 1000000000
}

function isUnistylesStyleSheet(t, path, state) {
    const callee = path.get('callee')

    return (
        t.isMemberExpression(callee.node) &&
        callee.node.property.name === 'create' &&
        t.isIdentifier(callee.node.object) &&
        callee.node.object.name === state.file.styleSheetLocalName
    )
}

function isKindOfStyleSheet(t, path, state) {
    if (!state.file.forceProcessing && !state.file.hasUnistylesImport) {
        return false
    }

    const callee = path.get('callee')

    return (
        t.isMemberExpression(callee.node) &&
        callee.node.property.name === 'create' &&
        t.isIdentifier(callee.node.object)
    )
}

function addStyleSheetTag(t, path, state) {
    const callee = path.get('callee')
    const uniqueId = stringToUniqueId(state.filename.replace(state.cwd, '')) + ++state.file.tagNumber

    callee.container.arguments.push(t.numericLiteral(uniqueId))
}

const getProperty = (t, property) => {
    if (!property) {
        return undefined
    }

    if (t.isIdentifier(property)) {
        return {
            properties: [property.name]
        }
    }

    if (t.isObjectPattern(property)) {
        const matchingProperties = property.properties.flatMap(p => getProperty(t, p))

        return {
            properties: matchingProperties.flatMap(properties => properties.properties)
        }
    }

    if (t.isObjectProperty(property) && t.isIdentifier(property.value)) {
        return {
            properties: [property.key.name]
        }
    }

    if (t.isObjectProperty(property) && t.isObjectPattern(property.value)) {
        const matchingProperties = property.value.properties.flatMap(p => getProperty(t, p))

        return {
            parent: property.key.name,
            properties: matchingProperties.flatMap(properties => properties.properties)
        }
    }

    return undefined
}

function getStylesDependenciesFromObject(t, path) {
    const detectedStylesWithVariants = new Set()
    const stylesheet = path.node.arguments[0]

    stylesheet.properties.forEach(property => {
        if (!t.isIdentifier(property.key)) {
            return
        }

        if (t.isObjectProperty(property)) {
            if(t.isObjectExpression(property.value)) {
                property.value.properties.forEach(innerProp => {
                    if (t.isIdentifier(innerProp.key) && innerProp.key.name === 'variants') {
                        detectedStylesWithVariants.add({
                            label: 'variants',
                            key: property.key.name
                        })
                    }
                })

            }
        }

        if (t.isArrowFunctionExpression(property.value)) {
            if(t.isObjectExpression(property.value.body)) {
                property.value.body.properties.forEach(innerProp => {
                    if (t.isIdentifier(innerProp.key) && innerProp.key.name === 'variants') {
                        detectedStylesWithVariants.add({
                            label: 'variants',
                            key: property.key.name
                        })
                    }
                })

            }
        }
    })

    const variants = Array.from(detectedStylesWithVariants)

    return variants.reduce((acc, { key, label }) => {
        if (acc[key]) {
            return {
                ...acc,
                [key]: [
                    ...acc[key],
                    label
                ]
            }
        }

        return {
            ...acc,
            [key]: [label]
        }
    }, {})
}

function getStylesDependenciesFromFunction(t, path) {
    const funcPath = path.get('arguments.0')

    if (!funcPath) {
        return
    }

    const params = funcPath.node.params
    const [themeParam, rtParam] = params

    let themeNames = []

    // destructured theme object
    if (themeParam && themeParam.type === 'ObjectPattern') {
        // If destructured, collect all property names
        for (const prop of themeParam.properties) {
            themeNames.push(getProperty(t, prop))
        }
    }

    // user used 'theme' without destructuring
    if (themeParam && themeParam.type === 'Identifier') {
        themeNames.push({
            properties: [themeParam.name]
        })
    }

    let rtNames = []

    // destructured rt object
    if (rtParam && rtParam.type === 'ObjectPattern') {
        // If destructured, collect all property names
        for (const prop of rtParam.properties) {
            rtNames.push(getProperty(t, prop))
        }
    }

    // user used 'rt' without destructuring
    if (rtParam && rtParam.type === 'Identifier') {
        rtNames.push({
            properties: [rtParam.name]
        })
    }

    // get returned object or return statement from StyleSheet.create function
    let returnedObjectPath = null

    if (funcPath.get('body').isObjectExpression()) {
        returnedObjectPath = funcPath.get('body')
    } else {
        funcPath.traverse({
            ReturnStatement(retPath) {
                if (!returnedObjectPath && retPath.get('argument').isObjectExpression()) {
                    returnedObjectPath = retPath.get('argument')
                }
            }
        })
    }

    if (!returnedObjectPath) {
        // there is no returned object
        // abort

        return
    }

    const detectedStylesWithVariants = new Set()

    // detect variants via Scope
    returnedObjectPath.get('properties').forEach(propPath => {
        // get style name
        const stylePath = propPath.get('key')

        if (!stylePath.isIdentifier()) {
            return
        }

        const styleKey = stylePath.node.name

        const valuePath = propPath.get('value')

        if (valuePath.isObjectExpression()) {
            const hasVariants = valuePath.get('properties').some(innerProp => {
                const innerKey = innerProp.get('key')

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
            if(t.isObjectExpression(valuePath.node.body)) {
                const hasVariants = valuePath.node.body.properties.some(innerProp => {

                    return t.isIdentifier(innerProp.key) && innerProp.key.name === 'variants'
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

    const detectedStylesWithTheme = new Set()

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
                const styleKey = keyNode.isIdentifier()
                    ? keyNode.node.name
                    : keyNode.isLiteral()
                        ? keyNode.node.value
                        : null

                if (styleKey) {
                    detectedStylesWithTheme.add({
                        label: 'theme',
                        key: styleKey
                    })
                }
            })
        })
    })

    const detectedStylesWithRt = new Set()
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

                if (!Boolean(toUnistylesDependency(parent))) {
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

                if (refPath.parentPath.isMemberExpression() && refPath.parentPath.get('object') === refPath) {
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
                    }
                }

                // find key of the style that we are referring to
                const containerProp = refPath
                    .findParent(parent => parent.isObjectProperty() && parent.parentPath === returnedObjectPath)

                if (!containerProp) {
                    return
                }

                const keyNode = containerProp.get('key')
                const styleKey = keyNode.isIdentifier()
                    ? keyNode.node.name
                    : keyNode.isLiteral()
                        ? keyNode.node.value
                        : null

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
        .reduce((acc, { key, label }) => {
            if (acc[key]) {
                return {
                    ...acc,
                    [key]: [
                        ...acc[key],
                        label
                    ]
                }
            }

            return {
                ...acc,
                [key]: [label]
            }
        }, {})
}

function toUnistylesDependency(dependency) {
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

        // breakpoints are too complex and are handled by C++
    }
}

function getReturnStatementsFromBody(t, node, results = []) {
    if (t.isReturnStatement(node)) {
        results.push(node)
    }

    if (t.isBlockStatement(node)) {
        node.body.forEach(child => getReturnStatementsFromBody(t, child, results))
    }

    if (t.isIfStatement(node)) {
        getReturnStatementsFromBody(t, node.consequent, results)

        if (node.alternate) {
            getReturnStatementsFromBody(t, node.alternate, results)
        }
    }

    return results
}

function addDependencies(t, state, styleName, unistyle, detectedDependencies) {
    const debugMessage = deps => {
        if (state.opts.debug) {
            const mappedDeps = deps
                .map(dep => Object.keys(UnistyleDependency).find(key => UnistyleDependency[key] === dep))
                .join(', ')

            console.log(`${state.filename.replace(`${state.file.opts.root}/`, '')}: styles.${styleName}: [${mappedDeps}]`)
        }
    }

    const styleDependencies = detectedDependencies.map(toUnistylesDependency)

    // add metadata about dependencies
    if (styleDependencies.length > 0) {
        const uniqueDependencies = Array.from(new Set(styleDependencies))

        debugMessage(uniqueDependencies)

        let targets = []

        if (t.isArrowFunctionExpression(unistyle.value) || t.isFunctionExpression(unistyle.value)) {
            if (t.isObjectExpression(unistyle.value.body)) {
                targets.push(unistyle.value.body)
            }

            if (t.isBlockStatement(unistyle.value.body)) {
                targets = getReturnStatementsFromBody(t, unistyle.value.body)
                    .map(node => {
                        if (t.isIdentifier(node.argument)) {
                            node.argument = t.objectExpression([
                                t.spreadElement(node.argument)
                            ])
                        }

                        return node.argument
                    })
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
                        t.arrayExpression(uniqueDependencies.map(dep => t.numericLiteral(dep)))
                    )
                )
            })
        }
    }
}

module.exports = {
    isUnistylesStyleSheet,
    addDependencies,
    addStyleSheetTag,
    getStylesDependenciesFromObject,
    getStylesDependenciesFromFunction,
    isKindOfStyleSheet
}
