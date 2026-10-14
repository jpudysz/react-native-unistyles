// the babel transformer of a Metro config, for config.spec.ts
module.exports = {
    transform: (args) => args,
    getCacheKey: () => 'upstream-cache-key',
}
