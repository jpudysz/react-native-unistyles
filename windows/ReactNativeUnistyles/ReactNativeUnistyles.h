#pragma once

#include "JSValue.h"
#include "NativeModules.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::ReactNativeUnistyles
{

REACT_MODULE(Unistyles)
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
        // todo

        return true;
    }

    private:
        ReactContext m_reactContext{nullptr};
};

} // namespace winrt::ReactNativeUnistyles
