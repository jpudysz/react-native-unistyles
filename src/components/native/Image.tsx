import React, { type ComponentProps, forwardRef } from "react";
import { type ImageStyle, Image as NativeImage, type StyleProp, type ViewStyle } from "react-native";
import { getClassName } from "../../core";
import { maybeWarnAboutMultipleUnistyles } from "../../core/warn";
import type { UnistylesValues } from "../../types";
import { copyComponentProperties } from "../../utils";
import { createUnistylesRef, keyInObject } from "../../web/utils";

const defaultWidthStyle = { width: "" };
const defaultHeightStyle = { height: "" };

type Props = ComponentProps<typeof NativeImage> & {
    style?: UnistylesValues;
    imageStyle?: UnistylesValues;
};

const UnistylesImage = forwardRef<unknown, Props>((props, forwardedRef) => {
    const classNames = getClassName(props.style);
    const ref = createUnistylesRef(classNames, forwardedRef);
    const hasWidthStyle = typeof props.style === "object" && keyInObject(props.style, "width");
    const hasHeightStyle = typeof props.style === "object" && keyInObject(props.style, "height");

    const styleArray = [
        classNames,
        // Clear inline width and height extracted from source
        hasWidthStyle && defaultWidthStyle,
        hasHeightStyle && defaultHeightStyle,
    ] as StyleProp<ImageStyle>;

    maybeWarnAboutMultipleUnistyles(props.style as ViewStyle, "Image");

    return <NativeImage {...props} style={styleArray} ref={ref} />;
});

export const Image = copyComponentProperties(NativeImage, UnistylesImage);
