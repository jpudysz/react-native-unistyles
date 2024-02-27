#pragma once

#include <future>
#include "JSValue.h"
#include <jsi/jsi.h>
#include "NativeModules.h"
#include <JSI/JsiApiContext.h>
#include <winrt/Microsoft.ReactNative.h>
#include <winrt/Windows.UI.Xaml.h>
#include <winrt/Windows.UI.Core.h>
#include <winrt/Windows.UI.ViewManagement.h>
#include "UnistylesRuntime.h"

using namespace winrt::Windows::UI::ViewManagement;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::UI::Xaml;
using namespace winrt::Windows::UI::Core;
using namespace facebook;

struct UIInitialInfo {
    Dimensions screen;
    std::string colorScheme;
    std::string contentSizeCategory;
};

namespace winrt::ReactNativeUnistyles
{

REACT_MODULE(Unistyles, L"Unistyles")
struct Unistyles {

    REACT_INIT(Initialize)
    void Initialize(ReactContext const &reactContext) noexcept {
        m_reactContext = reactContext;

        m_reactContext.UIDispatcher().Post([this]() mutable {
            this->windowSizeChange = Window::Current().CoreWindow().SizeChanged(TypedEventHandler<CoreWindow, WindowSizeChangedEventArgs>([=](CoreWindow const sender, WindowSizeChangedEventArgs const&) {
                auto bounds = Window::Current().Bounds();

                if (this->unistylesRuntime != nullptr) {
                    Dimensions screenDimensions = Dimensions{(int)bounds.Width, (int)bounds.Height};

                    ((UnistylesRuntime*)this->unistylesRuntime)->handleScreenSizeChange(screenDimensions, this->getInsets(), this->getStatusBarDimensions(), this->getNavigationBarDimensions());
                }
            }));

            UISettings settings;

            this->colorValuesChange = settings.ColorValuesChanged(TypedEventHandler<UISettings, IInspectable>([this](UISettings const& sender, IInspectable const&){
                if (this->unistylesRuntime != nullptr) {
                    ((UnistylesRuntime*)this->unistylesRuntime)->handleAppearanceChange(this->getColorScheme());
                }
            }));
        });
    }
    
    REACT_SYNC_METHOD(install)
    bool install() noexcept {
        if (m_reactContext == nullptr) {
            return false;
        }

        jsi::Runtime* jsiRuntime = TryGetOrCreateContextRuntime(m_reactContext);
        
        if (jsiRuntime == nullptr) {
            return false;
        }

        auto& runtime = *jsiRuntime;

        registerUnistylesHostObject(runtime);

        return true;
    }

    void registerUnistylesHostObject(jsi::Runtime& runtime) {
        std::promise<UIInitialInfo> uiInfoPromise;
        auto uiInfoFuture = uiInfoPromise.get_future();

        m_reactContext.UIDispatcher().Post([this, promise = std::move(uiInfoPromise)]() mutable {
            UIInitialInfo uiMetadata;
            auto bounds = Window::Current().Bounds();

            uiMetadata.screen = Dimensions{(int)bounds.Width, (int)bounds.Height};
            uiMetadata.colorScheme = this->getColorScheme();
            uiMetadata.contentSizeCategory = UnistylesUnspecifiedScheme;

            promise.set_value(std::move(uiMetadata));
        });

        UIInitialInfo uiInfo = uiInfoFuture.get();

        auto unistylesRuntime = std::make_shared<UnistylesRuntime>(
            uiInfo.screen,
            uiInfo.colorScheme,
            uiInfo.contentSizeCategory,
            this->getInsets(),
            this->getStatusBarDimensions(),
            this->getNavigationBarDimensions()
        );

        unistylesRuntime->onThemeChange([this](std::string theme) {
            winrt::hstring themeName = winrt::to_hstring(theme);

            auto payload = winrt::Microsoft::ReactNative::JSValueObject{
                {"type", "theme"},
                {"payload", winrt::Microsoft::ReactNative::JSValueObject{{"themeName", winrt::to_string(themeName)}}}
            };

            this->OnThemeChange(payload);
        });

        unistylesRuntime.get()->onLayoutChange([this](std::string breakpoint, std::string orientation, Dimensions& screen, Dimensions& statusBar, Insets& insets, Dimensions& navigationBar) {
            auto payload = winrt::Microsoft::ReactNative::JSValueObject{
                {"type", "layout"},
                {"payload", winrt::Microsoft::ReactNative::JSValueObject{
                    {"breakpoint", breakpoint},
                    {"orientation", orientation},
                    {"screen", winrt::Microsoft::ReactNative::JSValueObject{
                        {"width", screen.width},
                        {"height", screen.height}
                    }},
                    {"statusBar", winrt::Microsoft::ReactNative::JSValueObject{
                        {"width", statusBar.width},
                        {"height", statusBar.height}
                    }},
                    {"navigationBar", winrt::Microsoft::ReactNative::JSValueObject{
                        {"width", navigationBar.width},
                        {"height", navigationBar.height}
                    }},
                    {"insets", winrt::Microsoft::ReactNative::JSValueObject{
                        {"top", insets.top},
                        {"bottom", insets.bottom},
                        {"left", insets.left},
                        {"right", insets.right}
                    }},
                }}
            };

            this->OnLayoutChange(payload);
        });

        unistylesRuntime.get()->onPluginChange([this]() {
            auto payload = winrt::Microsoft::ReactNative::JSValueObject{
                {"type", "plugin"}
            };

            this->OnPluginChange(payload);
        });

        unistylesRuntime.get()->onContentSizeCategoryChange([this](std::string contentSizeCategory) {
            // not available on windows
        });

        this->unistylesRuntime = unistylesRuntime.get();

        auto hostObject = jsi::Object::createFromHostObject(runtime, unistylesRuntime);

        runtime.global().setProperty(runtime, "__UNISTYLES__", std::move(hostObject));
    }

    REACT_EVENT(OnThemeChange, L"__unistylesOnChange")
    std::function<void(winrt::Microsoft::ReactNative::JSValueObject const&)> OnThemeChange;

    REACT_EVENT(OnLayoutChange, L"__unistylesOnChange")
    std::function<void(winrt::Microsoft::ReactNative::JSValueObject const&)> OnLayoutChange;

    REACT_EVENT(OnPluginChange, L"__unistylesOnChange")
    std::function<void(winrt::Microsoft::ReactNative::JSValueObject const&)> OnPluginChange;

    ~Unistyles() {
        if (this->unistylesRuntime != nullptr) {
            this->unistylesRuntime = nullptr;
        }

        if (this->windowSizeChange) {
            Window::Current().CoreWindow().SizeChanged(this->windowSizeChange);
        }

        if (this->colorValuesChange) {
            UISettings settings;

            settings.ColorValuesChanged(this->colorValuesChange);
        }
    }

    private:
        ReactContext m_reactContext{nullptr};
        void* unistylesRuntime{ nullptr };
        winrt::event_token windowSizeChange{ NULL };
        winrt::event_token colorValuesChange{ NULL };

        std::string getColorScheme() {
            auto uiSettings = UISettings();
            auto background = uiSettings.GetColorValue(UIColorType::Background);

            bool isDark = background == winrt::Windows::UI::Colors::Black();

            if (isDark) {
                return UnistylesDarkScheme;
            }

            bool isLight = background == winrt::Windows::UI::Colors::White();

            if (isLight) {
                return UnistylesLightScheme;
            }

            return UnistylesUnspecifiedScheme;
        }

        Insets getInsets() {
            return Insets{ 0, 0, 0, 0 };
        }

        Dimensions getStatusBarDimensions() {
            return {0, 0};
        }

        Dimensions getNavigationBarDimensions() {
            return { 0, 0 };
        }
};

} // namespace winrt::ReactNativeUnistyles
