#pragma once

#include <jsi/jsi.h>
#include <regex>
#include <string>
#include <optional>
#include "UnistylesModel.h"

namespace unistyles::mq {

struct UnistylesParsedMqDimension {
    double from;
    double to;
};

struct UnistylesParsedMq {
    std::optional<UnistylesParsedMqDimension> width;
    std::optional<UnistylesParsedMqDimension> height;
};

inline bool isMq(const std::string& mq) {
    std::regex pattern(R"(:([hw])\[(\d+)(?:,\s*(\d+|Infinity))?\])");

    return std::regex_search(mq, pattern);
}

inline bool isValidMq(const UnistylesParsedMq& parsedMq) {
    if (parsedMq.width && parsedMq.height) {
        return parsedMq.width->from <= parsedMq.width->to && parsedMq.height->from <= parsedMq.height->to;
    }

    if (parsedMq.width) {
        return parsedMq.width->from <= parsedMq.width->to;
    }

    if (parsedMq.height) {
        return parsedMq.height->from <= parsedMq.height->to;
    }

    return false;
}

inline UnistylesParsedMq parseMq(const std::string& mq) {
    const std::regex UNISTYLES_WIDTH_REGEX(R"(:(w)\[(\d+)(?:,\s*(\d+|Infinity))?\])");
    const std::regex UNISTYLES_HEIGHT_REGEX(R"(:(h)\[(\d+)(?:,\s*(\d+|Infinity))?\])");

    UnistylesParsedMq result;
    std::smatch match;

    if (std::regex_search(mq, match, UNISTYLES_WIDTH_REGEX)) {
        double from = std::stod(match[2]);
        double to = match[3].matched
        ? (match[3] == "Infinity" ? std::numeric_limits<double>::infinity(): std::stod(match[3]))
        : from;

        result.width = UnistylesParsedMqDimension{from, to};
    }

    if (std::regex_search(mq, match, UNISTYLES_HEIGHT_REGEX)) {
        double from = std::stod(match[2]);
        double to = match[3].matched
        ? (match[3] == "Infinity" ? std::numeric_limits<double>::infinity() : std::stod(match[3]))
        : from;

        result.height = UnistylesParsedMqDimension{from, to};
    }

    return result;
}

inline bool isWithinTheWidth(const UnistylesParsedMqDimension& width, double screenWidth) {
    return screenWidth >= width.from && screenWidth <= width.to;
}

inline bool isWithinTheHeight(const UnistylesParsedMqDimension& height, double screenHeight) {
    return screenHeight >= height.from && screenHeight <= height.to;
}

inline bool isWithinTheWidthAndHeight(const UnistylesParsedMq& parsedMq, const Dimensions& screenSize) {
    if (parsedMq.width && parsedMq.height) {
        return isWithinTheWidth(*parsedMq.width, screenSize.width) &&
        isWithinTheHeight(*parsedMq.height, screenSize.height);
    }

    if (parsedMq.width) {
        return isWithinTheWidth(*parsedMq.width, screenSize.width);
    }

    if (parsedMq.height) {
        return isWithinTheHeight(*parsedMq.height, screenSize.height);
    }

    return false;
}

inline bool getFrom(const std::string& key, Dimensions& screenSize) {
    if (!isMq(key)) {
        return false;
    }

    auto parsedMq = parseMq(key);

    if (!isValidMq(parsedMq)) {
        return false;
    }

    return isWithinTheWidthAndHeight(parsedMq, screenSize);
}

}
