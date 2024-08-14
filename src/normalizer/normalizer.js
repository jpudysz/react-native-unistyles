// based on react-native-web normalizer
// https://github.com/necolas/react-native-web
import normalizeColors from '@react-native/normalize-colors';
export const normalizeColor = (color, opacity = 1) => {
    // If the opacity is 1 there's no need to normalize the color
    if (opacity === 1) {
        return color;
    }
    const integer = normalizeColors(color);
    // If the color is an unknown format, the return value is null
    if (integer === null) {
        return color;
    }
    const hex = integer.toString(16).padStart(8, '0');
    if (hex.length === 8) {
        const [r = 0, g = 0, b = 0, a = 1] = hex
            .split(/(?=(?:..)*$)/)
            .map(x => Number.parseInt(x, 16))
            .filter(num => !Number.isNaN(num));
        return `rgba(${r},${g},${b},${(a / 255) * opacity})`;
    }
    return color;
};
export const normalizeNumericValue = (value) => value ? `${value}px` : value;
const normalizeTransform = (key, value) => {
    if (key.includes('scale')) {
        return value;
    }
    if (typeof value === 'number') {
        return normalizeNumericValue(value);
    }
    return value;
};
const createTextShadowValue = (style) => {
    // at this point every prop is present
    const { textShadowColor, textShadowOffset, textShadowRadius } = style;
    const offsetX = normalizeNumericValue(textShadowOffset.width);
    const offsetY = normalizeNumericValue(textShadowOffset.height);
    const radius = normalizeNumericValue(textShadowRadius);
    const color = normalizeColor(textShadowColor);
    return `${offsetX} ${offsetY} ${radius} ${color}`;
};
const createBoxShadowValue = (style) => {
    // at this point every prop is present
    const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = style;
    const offsetX = normalizeNumericValue(shadowOffset.width);
    const offsetY = normalizeNumericValue(shadowOffset.height);
    const radius = normalizeNumericValue(shadowRadius);
    const color = normalizeColor(shadowColor, shadowOpacity);
    return `${offsetX} ${offsetY} ${radius} ${color}`;
};
const createTransformValue = (transforms) => transforms
    .map(transform => {
    const [key] = Object.keys(transform);
    if (!key) {
        return undefined;
    }
    const value = transform[key];
    switch (key) {
        case 'matrix':
        case 'matrix3d':
            return `${key}(${value.join(',')})`;
        default:
            return `${key}(${normalizeTransform(key, value)})`;
    }
})
    .filter(Boolean)
    .join(' ');
export const preprocessor = {
    createTextShadowValue,
    createBoxShadowValue,
    createTransformValue
};
