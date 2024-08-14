import { normalizeStyle } from '../normalizer';
export const normalizeWebStylesPlugin = {
    name: '__unistylesNormalizeWebStyles',
    onParsedStyle: (_key, styles) => normalizeStyle(styles)
};
