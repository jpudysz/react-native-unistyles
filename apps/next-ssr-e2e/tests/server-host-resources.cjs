'use strict'

process.env.NODE_ENV = 'production'

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

const { createRequire } = Module
const rsdwEntry = require.resolve('../../../packages/unistyles/node_modules/react-server-dom-webpack/server.node')
const requireFromRsdw = createRequire(rsdwEntry)
const React = requireFromRsdw('react')
const { renderToReadableStream } = require(rsdwEntry)

const {
    getServerUnistylesStyle,
} = require('react-native-unistyles/internal/server-unistyles-style')
const {
    withUnistyles,
} = require('../../../packages/unistyles/lib/commonjs/core/withUnistyles/withUnistyles')
const { configureServices, services } = require('../../../packages/unistyles/lib/commonjs/web/services')

configureServices({
    settings: {
        initialTheme: 'light',
    },
    themes: {
        light: {},
    },
})

const countOccurrences = (value, search) => value.split(search).length - 1

const createClassName = hash => [
    {
        $$css: true,
        hash,
        injectedClassName: hash,
    },
]

const readFlight = async element => {
    const stream = await renderToReadableStream(element, {})

    return new Response(stream).text()
}

const assertSerializedOnce = ({ css, label, output }) => {
    const cssCount = countOccurrences(output, css)
    const hrefCount = output.match(/unistyles:unistyles_[a-z0-9]+/gi)?.length ?? 0

    if (cssCount !== 1) {
        throw new Error(`${label} serialized its CSS ${cssCount} times instead of once:\n${output}`)
    }

    if (hrefCount !== 1) {
        throw new Error(`${label} serialized its stylesheet href ${hrefCount} times instead of once:\n${output}`)
    }
}

const repeatedHash = 'repeated_host'
const repeatedClassName = createClassName(repeatedHash)
const repeatedCss = `.${repeatedHash}{color:red;}`

const RepeatedHost = () => getServerUnistylesStyle([repeatedClassName])

const RepeatedResourceRequest = () => {
    services.registry.css.set({
        className: repeatedHash,
        propertyKey: 'color',
        value: 'red',
    })

    return React.createElement(
        React.Fragment,
        null,
        ...Array.from({ length: 10 }, (_, index) => React.createElement(RepeatedHost, { key: index })),
    )
}

const testRepeatedResourceSerialization = async () => {
    const output = await readFlight(React.createElement(RepeatedResourceRequest))

    assertSerializedOnce({
        css: repeatedCss,
        label: 'Repeated host resource',
        output,
    })
}

const retryHash = 'retry_host'
const retryClassName = createClassName(retryHash)
const retryCss = `.${retryHash}{color:green;}`

const testSuspenseRetry = async () => {
    let attempts = 0
    let resolveRetry = () => {}
    const retry = new Promise(resolve => {
        resolveRetry = resolve
    })

    const RetryHost = () => {
        services.registry.css.set({
            className: retryHash,
            propertyKey: 'color',
            value: 'green',
        })

        const style = getServerUnistylesStyle([retryClassName])

        if (attempts++ === 0) {
            setImmediate(resolveRetry)
            throw retry
        }

        return style
    }

    const output = await readFlight(React.createElement(RetryHost))

    if (attempts !== 2) {
        throw new Error(`Suspense host rendered ${attempts} times instead of retrying exactly once`)
    }

    assertSerializedOnce({
        css: retryCss,
        label: 'Suspense retry resource',
        output,
    })
}

const bulkResourceCount = 128

const testIndexedHostLookup = async () => {
    const hashes = Array.from({ length: bulkResourceCount }, (_, index) => `indexed_host_${index}`)
    const classNames = hashes.map(createClassName)

    const IndexedResourceRequest = () => {
        hashes.forEach(hash => {
            services.registry.css.set({
                className: hash,
                propertyKey: 'color',
                value: 'blue',
            })
        })

        Object.defineProperty(services.registry.css.mainMap, Symbol.iterator, {
            configurable: true,
            value: () => {
                throw new Error('Host-local stylesheet lookup scanned the global CSS registry')
            },
        })

        return React.createElement(
            React.Fragment,
            null,
            ...classNames.map((className, index) =>
                React.createElement(React.Fragment, { key: index }, getServerUnistylesStyle([className])),
            ),
        )
    }

    const output = await readFlight(React.createElement(IndexedResourceRequest))
    const serializedRules = output.match(/\.indexed_host_\d+\{color:blue;\}/g)?.length ?? 0

    if (serializedRules !== bulkResourceCount) {
        throw new Error(
            `Indexed host lookup serialized ${serializedRules} of ${bulkResourceCount} expected resources:\n${output}`,
        )
    }
}

const testWithUnistylesResource = async () => {
    const Host = props => React.createElement('section', props)
    const WrappedHost = withUnistyles(Host)
    const output = await readFlight(
        React.createElement(WrappedHost, {
            style: {
                color: 'purple',
            },
        }),
    )

    if (!output.includes(' > *{color:purple;}')) {
        throw new Error(`withUnistyles did not serialize its child resource:\n${output}`)
    }
}

const run = async () => {
    await testRepeatedResourceSerialization()
    await testSuspenseRetry()
    await testIndexedHostLookup()
    await testWithUnistylesResource()
}

run().catch(error => {
    console.error(error)
    process.exitCode = 1
})
