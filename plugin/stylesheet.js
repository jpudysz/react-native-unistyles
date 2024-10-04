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
    NavigationBar: 13
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

function analyzeDependencies(t, state, name, unistyleObj, themeName, rtName) {
    const debugMessage = deps => {
        if (state.opts.debug) {
            const mappedDeps = deps
                .map(dep => Object.keys(UnistyleDependency).find(key => UnistyleDependency[key] === dep))
                .join(', ')

            console.log(`[${state.filename}]: "${name}" dependencies: ${mappedDeps}`)
        }
    }
    const unistyle = unistyleObj.properties
    const dependencies = []

    Object.values(unistyle).forEach(uni => {
        const identifier = getIdentifierNameFromExpression(t, uni.value)

        if (identifier.includes(themeName)) {
            dependencies.push(UnistyleDependency.Theme)
        }

        if (identifier.includes(rtName)) {
            const propertyNames = getSecondPropertyName(t, uni.value)

            propertyNames
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
                        case 'orientation': {
                            dependencies.push(UnistyleDependency.Orientation)

                            return
                        }
                        case 'contentSizeCategory': {
                            dependencies.push(UnistyleDependency.ContentSizeCategory)

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

module.exports = {
    isUnistylesStyleSheet,
    analyzeDependencies
}
