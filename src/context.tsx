import React, { useEffect, useState } from "react";
import type { UnistylesBreakpoints } from "./global";
import { unistyles } from "./core";
import type {
    ScreenDimensions,
    ScreenInsets,
    ScreenSize,
    UnistylesEvents,
    UnistylesMobileLayoutEvent,
    UnistylesTheme,
    UnistylesThemeEvent,
} from "./types";
import { UnistylesEventType } from "./common";
import { NativeEventEmitter, NativeModules } from "react-native";

export type TUnistylesContext = {
    plugins: string[];
    theme: UnistylesTheme;
    layout: {
        screen: ScreenSize;
        statusBar: ScreenDimensions;
        navigationBar: ScreenDimensions;
        insets: ScreenInsets;
        breakpoint: keyof UnistylesBreakpoints;
        orientation: "landscape" | "portrait";
    };
};

const unistylesEvents = new NativeEventEmitter(NativeModules.Unistyles);

export const UnistylesContext = React.createContext<TUnistylesContext | undefined>(undefined);

export const UnistylesProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState(unistyles.registry.getTheme(unistyles.runtime.themeName));
    const [plugins, setPlugins] = useState(unistyles.runtime.enabledPlugins);
    const [layout, setLayout] = useState({
        breakpoint: unistyles.runtime.breakpoint,
        orientation: unistyles.runtime.orientation,
        screen: {
            width: unistyles.runtime.screen.width,
            height: unistyles.runtime.screen.height,
        },
        statusBar: {
            width: unistyles.runtime.statusBar.width,
            height: unistyles.runtime.statusBar.height,
        },
        navigationBar: {
            width: unistyles.runtime.navigationBar.width,
            height: unistyles.runtime.navigationBar.height,
        },
        insets: {
            top: unistyles.runtime.insets.top,
            bottom: unistyles.runtime.insets.bottom,
            left: unistyles.runtime.insets.left,
            right: unistyles.runtime.insets.right,
        },
    });

    useEffect(() => {
        const subscription = unistylesEvents.addListener("__unistylesOnChange", (event: UnistylesEvents) => {
            switch (event.type) {
                case UnistylesEventType.Theme: {
                    const themeEvent = event as UnistylesThemeEvent;

                    return setTheme(unistyles.registry.getTheme(themeEvent.payload.themeName));
                }
                case UnistylesEventType.Layout: {
                    const layoutEvent = event as UnistylesMobileLayoutEvent;

                    return setLayout({
                        breakpoint: layoutEvent.payload.breakpoint,
                        orientation: layoutEvent.payload.orientation,
                        screen: layoutEvent.payload.screen,
                        statusBar: layoutEvent.payload.statusBar,
                        insets: layoutEvent.payload.insets,
                        navigationBar: layoutEvent.payload.navigationBar,
                    });
                }
                case UnistylesEventType.Plugin: {
                    return setPlugins(unistyles.runtime.enabledPlugins);
                }
                default:
                    return;
            }
        });

        return subscription.remove;
    }, []);
    return <UnistylesContext.Provider value={{ theme, layout, plugins }}>{children}</UnistylesContext.Provider>;
};
