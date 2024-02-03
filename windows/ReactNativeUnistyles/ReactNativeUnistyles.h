#pragma once

#include <future>
#include "JSValue.h"
#include <jsi/jsi.h>
#include "NativeModules.h"
#include <JSI/JsiApiContext.h>
#include <winrt/Microsoft.ReactNative.h>
#include <winrt/Windows.UI.ViewManagement.h>
#include "UnistylesRuntime.h"

using namespace winrt::Windows::UI::ViewManagement;
using namespace winrt::Microsoft::ReactNative;
using namespace facebook;

struct UIInfo {
    int screenWidth;
    int screenHeight;
    std::string colorScheme;
    std::string contentSizeCategory;
};

namespace winrt::ReactNativeUnistyles
{

REACT_MODULE(Unistyles, L"Unistyles")
struct Unistyles
{
    REACT_INIT(Initialize)
    void Initialize(ReactContext const &reactContext) noexcept
    {
        m_reactContext = reactContext;
    }
    
    REACT_SYNC_METHOD(install)
    bool install() noexcept
    {
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

    void registerUnistylesHostObject(jsi::Runtime& runtime)
    {
        std::promise<UIInfo> uiInfoPromise;
        auto uiInfoFuture = uiInfoPromise.get_future();

        m_reactContext.UIDispatcher().Post([promise = std::move(uiInfoPromise)]() mutable {
            UIInfo uiMetadata;
            auto appllicationView = ApplicationView::GetForCurrentView();
            auto bounds = appllicationView.VisibleBounds();

            uiMetadata.screenWidth = bounds.Width;
            uiMetadata.screenHeight = bounds.Height;

            auto uiSettings = UISettings();
            auto background = uiSettings.GetColorValue(UIColorType::Background);
            bool isDark = background == winrt::Windows::UI::Colors::Black();
            bool isLight = background == winrt::Windows::UI::Colors::White();
      
            uiMetadata.colorScheme = isDark ? "dark" : isLight ? "light" : "unspecified";
            uiMetadata.contentSizeCategory = "unspecified";

            promise.set_value(std::move(uiMetadata));
        });

        UIInfo uiInfo = uiInfoFuture.get();

        auto unistylesRuntime = std::make_shared<UnistylesRuntime>(
            uiInfo.screenWidth,
            uiInfo.screenHeight,
            uiInfo.colorScheme,
            uiInfo.contentSizeCategory
        );

        unistylesRuntime->onThemeChange([this](std::string theme) {
            winrt::hstring themeName = winrt::to_hstring(theme);

            auto payload = winrt::Microsoft::ReactNative::JSValueObject{
                {"type", "theme"},
                {"payload", winrt::Microsoft::ReactNative::JSValueObject{{"themeName", winrt::to_string(themeName)}}}
            };

            this->OnThemeChange(payload);
        });

        unistylesRuntime.get()->onLayoutChange([this](std::string breakpoint, std::string orientation, int width, int height) {
            auto payload = winrt::Microsoft::ReactNative::JSValueObject{
                {"type", "layout"},
                {"payload", winrt::Microsoft::ReactNative::JSValueObject{
                    {"breakpoint", breakpoint},
                    {"orientation", orientation},
                    {"screen", winrt::Microsoft::ReactNative::JSValueObject{
                        {"width", width},
                        {"height", height}
                    }}
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
            // not available for windows
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
    }

    private:
        ReactContext m_reactContext{nullptr};
        void* unistylesRuntime{ nullptr };
};

} // namespace winrt::ReactNativeUnistyles
