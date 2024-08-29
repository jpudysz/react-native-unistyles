#pragma once

#include <optional>
#include <regex>
#include "Dimensions.hpp"

namespace margelo::nitro::unistyles::core {

struct ParsedMQDimension {
    double from;
    double to;
};

struct ParsedMQ {
    std::optional<ParsedMQDimension> width;
    std::optional<ParsedMQDimension> height;
};

struct UnistylesMQ {
    UnistylesMQ(const std::string& maybeMQ) {
        if (!this->checkIsMQ(maybeMQ)) {
            return;
        }
        
        this->parseMQ(maybeMQ);
        
        if (!this->checkIsValidMQ()) {
            return;
        }
        
        this->isValid = true;
    }

    bool isMQ();
    bool isWithinTheWidthAndHeight(const Dimensions& screenSize);
    
private:
    bool isValid = false;
    std::optional<ParsedMQ> parsedMQ;
    bool checkIsValidMQ();
    bool checkIsMQ(const std::string& maybeMQ);
    void parseMQ(const std::string& maybeMQ);
    bool isWithinScreenWidth(const ParsedMQDimension& width, double screenWidth);
    bool isWithinScreenHeight(const ParsedMQDimension& height, double screenHeight);
};

}
