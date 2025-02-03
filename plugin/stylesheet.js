const { getIdentifierNameFromExpression, getSecondPropertyName } = require('./common')

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
    let hash = 0;

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
    if (!state.file.forceProcessing) {
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

function getStyleSheetLocalNames(t, functionArg) {
    const params = functionArg.params
    const hasTheme = params.length >= 1
    const hasMiniRuntime = params.length === 2
    const getProperty = (property, allowNested) => {
        if (t.isIdentifier(property.value)) {
            return property.value.name
        }

        if (!t.isObjectPattern(property.value)) {
            return undefined
        }

        if (allowNested) {
            return property.value.properties.flatMap(getProperty)
        }

        // we can force allow nested only for insets
        const hasIme = property.value.properties.find(property => property.key.name === 'ime')
        const lastKeyValue = property.value.properties.flatMap(getProperty)

        if (hasIme) {
            return lastKeyValue
        }

        return `${property.key.name}.${lastKeyValue}`
    }
    const getLocalNames = (param, allowNested) => {
        if (t.isObjectPattern(param)) {
            return param.properties
                .flatMap(property => getProperty(property, allowNested))
                .filter(Boolean)
        }


        if (t.isIdentifier(param)) {
            return [param.name]
        }

        return []
    }

    return {
        theme: hasTheme ? getLocalNames(params[0], true) : [],
        miniRuntime: hasMiniRuntime ? getLocalNames(params[1], false) : []
    }
}

function maybeAddThemeDependencyToMemberExpression(t, property, themeLocalNames) {
    if (t.isIdentifier(property)) {
        return themeLocalNames.includes(property.name)
    }

    if (t.isObjectProperty(property)) {
        return maybeAddThemeDependencyToMemberExpression(t, property.value, themeLocalNames)
    }

    if (t.isMemberExpression(property)) {
        return maybeAddThemeDependencyToMemberExpression(t, property.object, themeLocalNames)
    }
}


/** @param {import('./index').UnistylesPluginPass} state */
function analyzeDependencies(t, state, name, unistyleObj, themeNames, rtNames) {
    const debugMessage = deps => {
        if (state.opts.debug) {
            const mappedDeps = deps
                .map(dep => Object.keys(UnistyleDependency).find(key => UnistyleDependency[key] === dep))
                .join(', ')

            console.log(`${state.filename.replace(`${state.file.opts.root}/`, '')}: styles.${name}: [${mappedDeps}]`)
        }
    }
    const unistyle = unistyleObj.properties
    const dependencies = []

    Object.values(unistyle).forEach(uni => {
        const identifiers = getIdentifierNameFromExpression(t, uni)

        if (themeNames.some(name => identifiers.some(id => id === name))) {
            dependencies.push(UnistyleDependency.Theme)
        }

        const matchingRtNames = rtNames.reduce((acc, name) => {
            if (name.includes('.')) {
                const key = name.split('.').at(0)

                if (identifiers.some(id => name.includes(id))) {
                    return [
                        ...acc,
                        key
                    ]
                }

                return acc
            }


            if (identifiers.some(id => id === name)) {
                return [
                    ...acc,
                    name
                ]
            }

            return acc
        }, [])

        if (matchingRtNames.length > 0) {
            const propertyNames = getSecondPropertyName(t, uni.value)

            matchingRtNames
                .concat(propertyNames)
                .filter(Boolean)
                .forEach(propertyName => {
                    switch (propertyName) {
                        case 'themeName': {
                            dependencies.push(UnistyleDependency.ThemeName)

                            return
                        }
                        case 'adaptiveThemes': {
                            dependencies.push(UnistyleDependency.AdaptiveThemes)

                            return
                        }
                        case 'breakpoint': {
                            dependencies.push(UnistyleDependency.Breakpoints)

                            return
                        }
                        case 'colorScheme': {
                            dependencies.push(UnistyleDependency.ColorScheme)

                            return
                        }
                        case 'screen': {
                            dependencies.push(UnistyleDependency.Dimensions)

                            return
                        }
                        case 'isPortrait':
                        case 'isLandscape': {
                            dependencies.push(UnistyleDependency.Orientation)

                            return
                        }
                        case 'contentSizeCategory': {
                            dependencies.push(UnistyleDependency.ContentSizeCategory)

                            return
                        }
                        case 'ime': {
                            dependencies.push(UnistyleDependency.Ime)

                            return
                        }
                        case 'insets': {
                            dependencies.push(UnistyleDependency.Insets)

                            return
                        }
                        case 'pixelRatio': {
                            dependencies.push(UnistyleDependency.PixelRatio)

                            return
                        }
                        case 'fontScale': {
                            dependencies.push(UnistyleDependency.FontScale)

                            return
                        }
                        case 'statusBar': {
                            dependencies.push(UnistyleDependency.StatusBar)

                            return
                        }
                        case 'navigationBar': {
                            dependencies.push(UnistyleDependency.NavigationBar)

                            return
                        }
                    }
                })
        }

        if (uni.key && uni.key.name === 'variants') {
            dependencies.push(UnistyleDependency.Variants)
        }

        // breakpoints are too complex and are handled by C++
    })

    // add dependencies to the unistyle object if any found
    if (dependencies.length > 0) {
        const uniqueDependencies = Array.from(new Set(dependencies))

        debugMessage(uniqueDependencies)

        unistyleObj.properties.push(
            t.objectProperty(
                t.identifier('uni__dependencies'),
                t.arrayExpression(uniqueDependencies.map(dep => t.numericLiteral(dep)))
            )
        )
    }
}

function getUnistyles(t, property) {
    const propertyValue = t.isArrowFunctionExpression(property.value)
        ? property.value.body
        : property.value

    if (t.isObjectExpression(propertyValue)) {
        return [propertyValue]
    }

    if (t.isBlockStatement(propertyValue)) {
        // here we might have single return statement
        // or if-else statements with return statements
        return propertyValue.body
            .flatMap(value => {
                if (t.isReturnStatement(value)) {
                    return [value]
                }

                if (!t.isIfStatement(value)) {
                    return []
                }

                return [value.consequent, value.alternate]
                    .filter(Boolean)
                    .flatMap(value => {
                        if (t.isBlockStatement(value)) {
                            return value.body.filter(t.isReturnStatement)
                        }
                    })
            })
            .map(value => value.argument)
    }

    return []
}

function addThemeDependencyToMemberExpression(t, path) {
    path.value = t.objectExpression([
        t.spreadElement(path.value),
        t.objectProperty(
            t.identifier('uni__dependencies'),
            t.arrayExpression([t.numericLiteral(UnistyleDependency.Theme)])
        )
    ])
}

module.exports = {
    isUnistylesStyleSheet,
    analyzeDependencies,
    addStyleSheetTag,
    getUnistyles,
    isKindOfStyleSheet,
    getStyleSheetLocalNames,
    maybeAddThemeDependencyToMemberExpression,
    addThemeDependencyToMemberExpression
}
