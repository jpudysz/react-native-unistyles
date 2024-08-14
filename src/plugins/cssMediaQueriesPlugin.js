// prevent recursive import
import { createMediaQueryForStyles } from '../utils/cssMediaQuery';
export const cssMediaQueriesPlugin = {
    name: '__unistylesCSSMediaQueries',
    onParsedStyle: (_key, styles, runtime) => createMediaQueryForStyles(styles, runtime)
};
