import type { UnistylesValues } from '../types';
import { UnistylesShadowRegistry } from '../web';

export const getClassName = (unistyle: UnistylesValues | undefined | Array<UnistylesValues>) => {
    if (!unistyle) {
        return undefined
    }

    // @ts-expect-error hidden from TS
    const { hash, injectedClassName } = UnistylesShadowRegistry.addStyles(Array.isArray(unistyle) ? unistyle : [unistyle])

    return hash ? { $$css: true, hash, injectedClassName } : undefined
}
