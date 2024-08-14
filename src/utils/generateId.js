import { murmurhash2_32_gc } from './hash32';
export const generateReactNativeWebId = (key, value) => {
    const hashedString = murmurhash2_32_gc(key + value, 1).toString(36);
    return process.env.NODE_ENV !== 'production'
        ? `r-${key}-${hashedString}`
        : `r-${hashedString}`;
};
