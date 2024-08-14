import { getValueForBreakpoint } from './breakpoints';
import { isAndroid, isIOS } from '../common';
import { withPlugins } from './withPlugins';
export const proxifyFunction = (key, fn, variant) => new Proxy(fn, {
    apply: (target, thisArg, argumentsList) => withPlugins(key, parseStyle(target.apply(thisArg, argumentsList), variant))
});
export const isPlatformColor = (value) => {
    if (isIOS) {
        return 'semantic' in value && typeof value.semantic === 'object';
    }
    return isAndroid && 'resource_paths' in value && typeof value.resource_paths === 'object';
};
export const parseStyle = (style, variant = {}, parseMediaQueries = true) => Object
    .entries(style || {})
    .reduce((acc, [key, value]) => {
    // nested objects
    if (key === 'shadowOffset' || key === 'textShadowOffset') {
        acc[key] = parseStyle(value, variant);
        return acc;
    }
    // transforms
    if (key === 'transform' && Array.isArray(value)) {
        acc[key] = value.map(value => parseStyle(value, variant));
        return acc;
    }
    if (key === 'fontVariant' && Array.isArray(value)) {
        acc[key] = value;
        return acc;
    }
    // values or platform colors
    if (typeof value !== 'object' || isPlatformColor(value)) {
        acc[key] = value;
        return acc;
    }
    if (key === 'variants') {
        return {
            // biome-ignore lint/performance/noAccumulatingSpread: this function will be dropped in 3.0
            ...acc,
            ...Object
                .keys(value)
                .reduce((acc, key) => ({
                // biome-ignore lint/performance/noAccumulatingSpread: this function will be dropped in 3.0
                ...acc,
                // this will parse the styles of the selected variant (or default if it is undefined), if selected variant has no styles then it will fallback to default styles
                ...parseStyle((value)[key][variant[key]?.toString() || 'default'] ?? (value)[key].default ?? {})
            }), {})
        };
    }
    // don't parse media queries and breakpoints
    if (!parseMediaQueries) {
        return {
            // biome-ignore lint/performance/noAccumulatingSpread: this function will be dropped in 3.0
            ...acc,
            [key]: value
        };
    }
    return {
        // biome-ignore lint/performance/noAccumulatingSpread: this function will be dropped in 3.0
        ...acc,
        [key]: getValueForBreakpoint(value)
    };
}, {});
