import { useRef } from 'react';
export const useVariants = (variantsMap) => {
    const variantsRef = useRef(variantsMap);
    variantsRef.current = variantsMap;
    return variantsRef.current;
};
