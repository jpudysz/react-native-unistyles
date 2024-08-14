import { unistyles } from '../core';
const getMQValue = (value) => {
    if (typeof value === 'number') {
        return value;
    }
    if (value === null) {
        return 0;
    }
    return unistyles.registry.breakpoints[value] ?? 0;
};
/**
 * Utility to create cross-platform media queries
 * @returns - JavaScript symbol to be used in your stylesheet
 */
export const mq = {
    only: {
        width: (wMin = 0, wMax = Number.POSITIVE_INFINITY) => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]`,
        height: (hMin = 0, hMax = Number.POSITIVE_INFINITY) => `:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
    },
    width: (wMin = 0, wMax = Number.POSITIVE_INFINITY) => ({
        and: {
            height: (hMin = 0, hMax = Number.POSITIVE_INFINITY) => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
        }
    }),
    height: (hMin = 0, hMax = Number.POSITIVE_INFINITY) => ({
        and: {
            width: (wMin = 0, wMax = Number.POSITIVE_INFINITY) => `:w[${getMQValue(wMin)}, ${getMQValue(wMax)}]:h[${getMQValue(hMin)}, ${getMQValue(hMax)}]`
        }
    })
};
