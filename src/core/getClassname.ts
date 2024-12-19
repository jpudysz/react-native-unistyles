import type { UnistylesValues } from '../types';
import { deepMergeObjects } from '../utils';
import { UnistylesShadowRegistry } from '../web';

export const getClassName = (unistyle: UnistylesValues | undefined | Array<UnistylesValues>) => {
    if (!unistyle) {
        return undefined
    }

    const style = Array.isArray(unistyle)
        ? deepMergeObjects(...unistyle)
        : unistyle
    // @ts-expect-error hidden from TS
    const { hash, injectedClassName } = UnistylesShadowRegistry.addStyles(style)

    return hash ? { $$css: true, hash, injectedClassName } : undefined
}
