import type { UnistylesValues } from '../types';
import { deepMergeObjects } from '../utils';
import { UnistylesShadowRegistry } from '../web';

export const useClassname = (unistyle: UnistylesValues | undefined | Array<UnistylesValues>) => {
    if (!unistyle) {
        return undefined
    }

    const style = Array.isArray(unistyle)
        ? deepMergeObjects(...unistyle)
        : unistyle
    const { hash, injectedClassName } = UnistylesShadowRegistry.addStyles(style)

    return hash ? { $$css: true, hash, injectedClassName } : undefined
}
