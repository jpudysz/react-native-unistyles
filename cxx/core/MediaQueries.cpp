#include "MediaQueries.h"

using namespace margelo::nitro::unistyles;

bool core::UnistylesMQ::checkIsMQ(const std::string& maybeMQ) {
    std::regex pattern(R"(:([hw])\[(\d+)(?:,\s*(\d+|Infinity))?\])");

    return std::regex_search(maybeMQ, pattern);
}

bool core::UnistylesMQ::checkIsValidMQ() {
    if (parsedMQ->width && parsedMQ->height) {
        return parsedMQ->width->from <= parsedMQ->width->to && parsedMQ->height->from <= parsedMQ->height->to;
    }

    if (parsedMQ->width) {
        return parsedMQ->width->from <= parsedMQ->width->to;
    }

    if (parsedMQ->height) {
        return parsedMQ->height->from <= parsedMQ->height->to;
    }
    
    return false;
}

void core::UnistylesMQ::parseMQ(const std::string& maybeMQ) {
    const std::regex UNISTYLES_WIDTH_REGEX(R"(:(w)\[(\d+)(?:,\s*(\d+|Infinity))?\])");
    const std::regex UNISTYLES_HEIGHT_REGEX(R"(:(h)\[(\d+)(?:,\s*(\d+|Infinity))?\])");

    ParsedMQ result;
    std::smatch match;

    if (std::regex_search(maybeMQ, match, UNISTYLES_WIDTH_REGEX)) {
        double from = std::stod(match[2]);
        double to = match[3].matched
        ? (match[3] == "Infinity" ? std::numeric_limits<double>::infinity(): std::stod(match[3]))
        : from;
        
        result.width = ParsedMQDimension{from, to};
    }

    if (std::regex_search(maybeMQ, match, UNISTYLES_HEIGHT_REGEX)) {
        double from = std::stod(match[2]);
        double to = match[3].matched
        ? (match[3] == "Infinity" ? std::numeric_limits<double>::infinity() : std::stod(match[3]))
        : from;

        result.height = ParsedMQDimension{from, to};
    }
    
    this->parsedMQ = result;
}

bool core::UnistylesMQ::isWithinScreenWidth(const ParsedMQDimension& width, double screenWidth) {
    return screenWidth >= width.from && screenWidth <= width.to;
}

bool core::UnistylesMQ::isWithinScreenHeight(const ParsedMQDimension& height, double screenHeight) {
    return screenHeight >= height.from && screenHeight <= height.to;
}

bool core::UnistylesMQ::isWithinTheWidthAndHeight(const Dimensions& screenSize) {
    if (!isValid) {
        return false;
    }
    
    auto parsedMq = parsedMQ.value();
    
    if (parsedMq.width && parsedMq.height) {
        return isWithinScreenWidth(*parsedMq.width, screenSize.width) && isWithinScreenHeight(*parsedMq.height, screenSize.height);
    }

    if (parsedMq.width) {
        return isWithinScreenWidth(*parsedMq.width, screenSize.width);
    }

    if (parsedMq.height) {
        return isWithinScreenHeight(*parsedMq.height, screenSize.height);
    }

    return false;
}
