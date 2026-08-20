const Module = require('node:module')

const loadModule = Module._load

Module._load = function (request, parent, isMain) {
    if (request === 'react-native') {
        return {
            Animated: {
                Node: class {},
            },
        }
    }

    return loadModule.call(this, request, parent, isMain)
}

const React = require('react')
const { renderToReadableStream } = require('../../../packages/unistyles/node_modules/react-server-dom-webpack/server.node')

const {
    ServerUnistylesStyles,
} = require('../../../packages/unistyles/lib/commonjs/server/ServerUnistylesStyles')
const { services } = require('../../../packages/unistyles/lib/commonjs/web/services')

const createDeferred = () => {
    let resolve = () => {}
    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise
    })

    return {
        promise,
        resolve,
    }
}

const slowAdded = createDeferred()
const fastAdded = createDeferred()

const StylesRequest = async ({ id }) => {
    if (id === 'fast') {
        await slowAdded.promise
    }

    services.registry.css.set({
        className: `request_${id}`,
        propertyKey: 'color',
        value: id === 'slow' ? 'red' : 'blue',
    })

    if (id === 'slow') {
        slowAdded.resolve()
        await fastAdded.promise
    } else {
        fastAdded.resolve()
    }

    return React.createElement(ServerUnistylesStyles)
}

const readStream = async stream => {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let output = ''

    while (true) {
        const { done, value } = await reader.read()

        if (done) {
            return output
        }

        output += decoder.decode(value, {
            stream: true,
        })
    }
}

const renderRequest = id => readStream(renderToReadableStream(React.createElement(StylesRequest, { id }), {}))

const run = async () => {
    services.registry.reset()

    const [slowOutput, fastOutput] = await Promise.all([renderRequest('slow'), renderRequest('fast')])

    if (!slowOutput.includes('.request_slow{color:red;}') || slowOutput.includes('.request_fast')) {
        throw new Error(`Slow request received another request's styles:\n${slowOutput}`)
    }

    if (!fastOutput.includes('.request_fast{color:blue;}') || fastOutput.includes('.request_slow')) {
        throw new Error(`Fast request received another request's styles:\n${fastOutput}`)
    }
}

run().catch(error => {
    console.error(error)
    process.exitCode = 1
})
