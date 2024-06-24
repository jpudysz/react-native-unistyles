#pragma once

#include <future>
#include "JSValue.h"
#include <jsi/jsi.h>
#include "NativeModules.h"
#include <JSI/JsiApiContext.h>
#include <winrt/Microsoft.ReactNative.h>
#include <winrt/Windows.UI.Xaml.h>
#include <winrt/Windows.UI.Core.h>
#include <winrt/Windows.Graphics.Display.h>
#include <winrt/Windows.UI.ViewManagement.h>
#include "UnistylesRuntime.h"
#include <TurboModuleProvider.h>

using namespace winrt::Windows::UI::ViewManagement;
using namespace winrt::Windows::Graphics::Display;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::UI::Xaml;
using namespace winrt::Windows::UI::Core;
using namespace facebook;

namespace winrt::ReactNativeUnistyles
{

REACT_MODULE(Unistyles, L"Unistyles")
struct Unistyles {

    REACT_INIT(Initialize)
        void Initialize(ReactContext const& reactContext) noexcept {
        m_reactContext = reactContext;

        m_reactContext.UIDispatcher().Post([this]() mutable {
            this->windowSizeChange = Window::Current().CoreWindow().SizeChanged(TypedEventHandler<CoreWindow, WindowSizeChangedEventArgs>([=](CoreWindow const sender, WindowSizeChangedEventArgs const&) {
                if (this->unistylesRuntime != nullptr) {
                    ((UnistylesRuntime*)this->unistylesRuntime)->handleScreenSizeChange(getScreenDimensions(), std::nullopt, std::nullopt, std::nullopt);
                }
            }));

            this->colorValuesChange = UISettings().ColorValuesChanged(TypedEventHandler<UISettings, IInspectable>([this](UISettings const& sender, IInspectable const&) {
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
        auto callInvoker = MakeAbiCallInvoker(m_reactContext.Handle().JSDispatcher());

        registerUnistylesHostObject(runtime, callInvoker);

        return true;
    }

    void registerUnistylesHostObject(jsi::Runtime& runtime, std::shared_ptr<facebook::react::CallInvoker> callInvoker) {
        auto unistylesRuntime = std::make_shared<UnistylesRuntime>(runtime, callInvoker);

        this->unistylesRuntime = unistylesRuntime.get();

        makeShared((UnistylesRuntime*)unistylesRuntime.get());

        auto hostObject = jsi::Object::createFromHostObject(runtime, unistylesRuntime);

        runtime.global().setProperty(runtime, "__UNISTYLES__", std::move(hostObject));
    }

    void makeShared(UnistylesRuntime* unistylesRuntime) {
        unistylesRuntime->setScreenDimensionsCallback([this]() {
            return getScreenDimensions();
        });

        unistylesRuntime->setColorSchemeCallback([this]() {
            return getColorScheme();
        });

        m_reactContext.UIDispatcher().Post([this, unistylesRuntime]() {
            auto screen = getScreenDimensions();

            unistylesRuntime->screen = Dimensions({ screen.width, screen.height });
            unistylesRuntime->pixelRatio = screen.pixelRatio;
            unistylesRuntime->fontScale = screen.fontScale;
            unistylesRuntime->colorScheme = getColorScheme();
        });
    }

    ~Unistyles() {
        if (this->unistylesRuntime != nullptr) {
            this->unistylesRuntime = nullptr;
        }

        if (this->windowSizeChange) {
            this->windowSizeChange = { NULL };
        }

        if (this->colorValuesChange) {
            this->colorValuesChange = { NULL };
        }
    }

    private:
        ReactContext m_reactContext{nullptr};
        void* unistylesRuntime{ nullptr };
        winrt::event_token windowSizeChange{ NULL };
        winrt::event_token colorValuesChange{ NULL };

        std::string getColorScheme() {
            UISettings uiSettings;

            auto backgroundColor = uiSettings.GetColorValue(UIColorType::Background);

            bool isDark = backgroundColor == Colors::Black();

            if (isDark) {
                return UnistylesDarkScheme;
            }

            bool isLight = backgroundColor == Colors::White();

            if (isLight) {
                return UnistylesLightScheme;
            }

            return UnistylesUnspecifiedScheme;
        }

        Screen getScreenDimensions() {
            auto bounds = Window::Current().Bounds();
            auto displayInfo = DisplayInformation::GetForCurrentView();
            auto pixelRatio = displayInfo.LogicalDpi() / 96.0f;
            float fontScale = UISettings().TextScaleFactor();

            return Screen({ (int)bounds.Width, (int)bounds.Height, pixelRatio, fontScale });
        }
};

} // namespace winrt::ReactNativeUnistyles
