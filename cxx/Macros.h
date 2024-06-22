#pragma once

#define HOST_FN(name, args, fn_body) \
    jsi::Function::createFromHostFunction(rt, \
        jsi::PropNameID::forAscii(rt, name), \
        args, \
        [this, &fnName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value \
        fn_body \
    ); \

#define BIND_FN(fn) std::bind(&UnistylesRuntime::fn, this, std::placeholders::_1, std::placeholders::_2)
