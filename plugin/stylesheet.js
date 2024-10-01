const { getIdentifierNameFromExpression, getSecondPropertyName } = require('./common')

function isUnistylesStyleSheet(t, path, state) {
    const callee = path.get('callee')

    return (
        t.isMemberExpression(callee.node) &&
        callee.node.property.name === 'create' &&
        t.isIdentifier(callee.node.object) &&
        callee.node.object.name === state.file.styleSheetLocalName
    )
}

function analyzeDependencies(t, unistyleObj, themeName, rtName) {
    const unistyle = unistyleObj.properties
    const dependencies = []

    Object.values(unistyle).forEach(uni => {
        const isAccessingTheme = getIdentifierNameFromExpression(t, uni.value).some(name => name === themeName)

        if (isAccessingTheme) {
            dependencies.push(0)

            return
        }

        const isAccessingMiniRuntime = getIdentifierNameFromExpression(t, uni.value).some(name => name === rtName)

        if (isAccessingMiniRuntime) {
            const propertyName = getSecondPropertyName(t, uni.value)

            switch (propertyName) {
                case 'themeName': {
                    dependencies.push(1)

                    return
                }
                case 'adaptiveThemes': {
                    dependencies.push(2)

                    return
                }
                case 'colorScheme': {
                    dependencies.push(5)

                    return
                }
                case 'screen': {
                    dependencies.push(6)

                    return
                }
                case 'orientation': {
                    dependencies.push(7)

                    return
                }
                case 'contentSizeCategory': {
                    dependencies.push(8)

                    return
                }
                case 'insets': {
                    dependencies.push(9)

                    return
                }
                case 'pixelRatio': {
                    dependencies.push(10)

                    return
                }
                case 'fontScale': {
                    dependencies.push(11)

                    return
                }
                case 'statusBar': {
                    dependencies.push(12)

                    return
                }
                case 'navigationBar': {
                    dependencies.push(13)

                    return
                }
            }
        }

        // variants are detectable from C++
        // breakpoints are too complex and are handled by C++
    })

    // add dependencies to the unistyle object if any found
    if (dependencies.length > 0) {
        unistyleObj.properties.push(
            t.objectProperty(
                t.identifier('uni__dependencies'),
                t.arrayExpression(Array.from(new Set(dependencies)).map(dep => t.numericLiteral(dep)))
            )
        )
    }
}

module.exports = {
    isUnistylesStyleSheet,
    analyzeDependencies
}
