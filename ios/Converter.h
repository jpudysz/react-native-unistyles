#pragma once

#include <jsi/jsi.h>
#include "Helpers.h"

using namespace facebook;
using namespace margelo::nitro::unistyles;

id jsiValueToObjcValue(jsi::Runtime& rt, jsi::Value &value);
NSDictionary* convertJSIValueToDictionary(jsi::Runtime &rt, jsi::Value &value);

NSArray* convertJSIArrayToNSArray(jsi::Runtime& rt, const jsi::Array& jsiArray) {
    NSMutableArray* array = [NSMutableArray array];
    
    size_t length = jsiArray.length(rt);
    for (size_t i = 0; i < length; i++) {
        auto element = jsiArray.getValueAtIndex(rt, i);
        
        [array addObject:jsiValueToObjcValue(rt, element) ?: (id)kCFNull];
    }
    
    return array;
}

id jsiValueToObjcValue(jsi::Runtime& rt, jsi::Value &value) {
    if (value.isBool()) {
        return @(value.getBool());
    }
    
    if (value.isNumber()) {
        return @(value.getNumber());
    }
    
    if (value.isUndefined() || value.isNull()) {
        return nil;
    }
    
    if (value.isString()) {
        return [NSString stringWithUTF8String:value.asString(rt).utf8(rt).c_str()];
    }
    
    if (!value.isObject()) {
        return nil;
    }

    if (value.asObject(rt).isArray(rt)) {
        return convertJSIArrayToNSArray(rt, value.asObject(rt).asArray(rt));
    }
    
    return convertJSIValueToDictionary(rt, value);
}

NSDictionary* convertJSIValueToDictionary(jsi::Runtime &rt, jsi::Value &value) {
    NSMutableDictionary *dictionary = [NSMutableDictionary new];
    
    if (!value.isObject()) {
        return dictionary;
    }
    
    jsi::Object obj = value.asObject(rt);
    
    helpers::enumerateJSIObject(rt, obj, [&](const std::string propertyName, jsi::Value& propertyValue){
        id objcValue = jsiValueToObjcValue(rt, propertyValue);
        
        if (objcValue) {
            dictionary[@(propertyName.c_str())] = objcValue;
        }
    });
    
    return dictionary;
}
