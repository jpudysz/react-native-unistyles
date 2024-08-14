import { useMemo } from 'react';
import { unistyles } from '../core';
export const useInitialTheme = (forName) => {
    useMemo(() => {
        if (!unistyles.runtime.themeName) {
            unistyles.runtime.setTheme(forName);
        }
    }, []);
};
