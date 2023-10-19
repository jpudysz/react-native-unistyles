const fs = require('fs')

const error = message => {
    throw new Error(`🦄 [static-unistyles]: ${message}`)
}

const log = message => {
    console.log(`🦄 [static-unistyles]: ${message}`)
}

const isUnistyles = (t, callee) => {
    if (!t.isMemberExpression(callee) || !t.isMemberExpression(callee.object)) {
        return false
    }

    // look for Unistyles.Static
    const isUnistyles = t.isIdentifier(callee.object.object, { name: 'Unistyles' })
    const isStatic = t.isIdentifier(callee.object.property, { name: 'Static' })

    if (!isUnistyles || !isStatic) {
        return false
    }

    return true
}

const isTypeScriptFile = state => {
    const filename = state.file.opts.filename || 'local.ts'
    const extension = filename.split('.').at(1)

    return extension === 'ts' || extension === 'tsx'
}

const getBreakpoints = (t, callee, path) => {
    const isCallingRegisterBreakpoints = t.isIdentifier(callee.property, { name: 'registerBreakpoints' })

    if (!isCallingRegisterBreakpoints) {
        return undefined
    }

    const args = path.node.arguments

    if (args.length === 0) {
        error('Called Unistyles.Static.registerBreakpoints with no arguments.')
    }

    const breakpoints = args.at(0)

    if (t.isObjectExpression(breakpoints)) {
        return breakpoints.properties
    }

    if (!t.isIdentifier(breakpoints)) {
        return undefined
    }

    const binding = path.scope.getBinding(breakpoints.name)

    if (binding && t.isObjectExpression(binding.path.node.init)) {
        return binding.path.node.init.properties
    }

    error('Your breakpoints are not accessible statically. Move breakpoints definition to the same file where you call registerBreakpoints.')
}

const getThemes = (t, callee, path) => {
    const isCallingRegisterThemes = t.isIdentifier(callee.property, { name: 'registerThemes' })

    if (!isCallingRegisterThemes) {
        return undefined
    }

    const args = path.node.arguments

    if (args.length === 0) {
        error('Called Unistyles.Static.registerThemes with no arguments.')
    }

    const themes = args.at(0)

    if (t.isObjectExpression(themes) && themes.properties.length === 0) {
        error('Called Unistyles.Static.registerThemes with no theme.')
    }

    if (t.isObjectExpression(themes) && themes.properties.length > 0) {
        return themes.properties
    }

    if (!t.isIdentifier(themes)) {
        return undefined
    }

    const binding = path.scope.getBinding(themes.name)

    if (binding && t.isObjectExpression(binding.path.node.init)) {
        return binding.path.node.init.properties
    }

    error('Your themes are not accessible statically. Move themes definition to the same file where you call registerThemes.')
}

const sortBreakpoints = (t, properties) => properties
    .map(prop => {
        if (t.isNumericLiteral(prop.value) && t.isIdentifier(prop.key)) {
            return t.arrayExpression([
                t.stringLiteral(prop.key.name),
                t.numericLiteral(prop.value.value)
            ])
        }
    })
    .sort((a, b) => {
        if (a.elements && b.elements) {
            return a.elements[1].value - b.elements[1].value
        }

        return 0
    })

const saveModuleDeclaration = (fileName, output) => {
    if (!fs.existsSync('.unistyles')) {
        fs.mkdirSync('.unistyles')
    }

    fs.writeFileSync(`.unistyles/${fileName}`, output, 'utf8')
}

const getObjectStructure = (obj = {}, prefix = '') => Object
    .entries(obj)
    .reduce((acc, [key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
            return acc.concat(getObjectStructure(value, `${prefix}${key}.`))
        }

        return acc.concat(`${prefix}${key}`)
    }, [])

// this is tricky, and for sure should be extended, for now supports inline themes, spreads and references
const resolveValue = (node, scope) => {
    const type = node?.value?.type || node.type

    switch (type) {
        case 'Identifier': {
            const binding = scope.getBinding(node.value?.name || node.name)

            if (!binding) {
                return undefined
            }

            if (binding.path.isImportDefaultSpecifier() || binding.path.isImportSpecifier()) {
                error(`Reference to imported value '${node.name}' detected. Your themes are not accessible statically. Move themes definition to the same file where you call registerThemes.`)
            }

            if (binding.path.node.init) {
                return resolveValue(binding.path.node.init, binding.path.scope)
            }

            return undefined
        }
        case 'CallExpression': {
            if (node.callee.name === '_objectSpread') {
                return node.arguments.reduce((acc, arg) => {
                    const resolvedArg = resolveValue(arg, scope)

                    if (typeof resolvedArg === 'object' && resolvedArg !== null) {
                        return {
                            ...acc,
                            ...resolvedArg
                        }
                    }

                    return acc
                }, {})
            }

            return undefined
        }
        case 'ObjectExpression': {
            return node
                .properties
                ?.reduce((acc, prop) => {
                    switch (prop.type) {
                        case 'ObjectProperty': {
                            return {
                                ...acc,
                                [prop.key.name || prop.key.value]: resolveValue(prop.value, scope)
                            }
                        }
                        case 'SpreadElement': {
                            const spreadObj = resolveValue(prop.argument, scope)

                            if (spreadObj) {
                                return {
                                    ...acc,
                                    ...spreadObj
                                }
                            }

                            return acc
                        }
                        default:
                            return acc
                    }
                }, {})
        }
        case 'StringLiteral':
        case 'NumericLiteral':
        case 'BooleanLiteral':
        case 'NullLiteral': {
            return node.value
        }
        default:
            return undefined
    }
}

module.exports = {
    log,
    error,
    getThemes,
    isUnistyles,
    resolveValue,
    isTypeScriptFile,
    getBreakpoints,
    getObjectStructure,
    sortBreakpoints,
    saveModuleDeclaration
}
