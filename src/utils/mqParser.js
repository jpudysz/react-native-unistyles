const IS_UNISTYLES_REGEX = /:([hw])\[(\d+)(?:,\s*(\d+|Infinity))?]/;
const UNISTYLES_WIDTH_REGEX = /:(w)\[(\d+)(?:,\s*(\d+|Infinity))?]/;
const UNISTYLES_HEIGHT_REGEX = /:(h)\[(\d+)(?:,\s*(\d+|Infinity))?]/;
export const parseMq = (mq) => {
    const [, width, fromW, toW] = UNISTYLES_WIDTH_REGEX.exec(mq) || [];
    const [, height, fromH, toH] = UNISTYLES_HEIGHT_REGEX.exec(mq) || [];
    return {
        width: width ? {
            from: Number(fromW),
            to: Number(toW)
        } : undefined,
        height: height ? {
            from: Number(fromH),
            to: Number(toH)
        } : undefined
    };
};
export const isUnistylesMq = (mq) => IS_UNISTYLES_REGEX.test(mq);
export const isValidMq = (parsedMq) => {
    const { width, height } = parsedMq;
    if (width && height) {
        return width.from <= width.to && height.from <= height.to;
    }
    if (width) {
        return width.from <= width.to;
    }
    if (height) {
        return height.from <= height.to;
    }
    return false;
};
export const isWithinTheWidthAndHeight = (parsedMq, screenSize) => {
    const { width, height } = parsedMq;
    if (width && height) {
        return isWithinTheWidth(width, screenSize.width) && isWithinTheHeight(height, screenSize.height);
    }
    if (width) {
        return isWithinTheWidth(width, screenSize.width);
    }
    if (height) {
        return isWithinTheHeight(height, screenSize.height);
    }
    return false;
};
const isWithinTheWidth = (width, screenWidth) => {
    const { from, to } = width;
    return screenWidth >= from && screenWidth <= to;
};
const isWithinTheHeight = (height, screenHeight) => {
    const { from, to } = height;
    return screenHeight >= from && screenHeight <= to;
};
export const getKeyForUnistylesMediaQuery = (mediaQueries, screenSize) => {
    const mq = mediaQueries.find(([key]) => {
        if (!isUnistylesMq(key)) {
            return false;
        }
        const parsedMq = parseMq(key);
        if (!isValidMq(parsedMq)) {
            return false;
        }
        return isWithinTheWidthAndHeight(parsedMq, screenSize);
    });
    return mq?.at(0);
};
