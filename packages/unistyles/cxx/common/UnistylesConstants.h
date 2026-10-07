#pragma once

namespace margelo::nitro::unistyles::helpers {

static const std::string STYLESHEET_ID = "__stylesheetID";
static const std::string UNISTYLE_ID = "__unistyleID";
static const std::string ADD_VARIANTS_FN = "useVariants";
static const std::string STYLE_DEPENDENCIES = "uni__dependencies";
static const std::string STYLESHEET_VARIANTS = "__stylesheetVariants";
static const std::string WEB_STYLE_KEY = "_web";
static const std::string EXOTIC_STYLE_KEY = "_exotic";
static const std::string ARGUMENTS = "__uni__args";
static const std::string GET_STYLES = "uni__getStyles";
static const std::string UNDEFINED_MARKER = "__unistyles_undefined__";
static const std::string RUNTIME_REPLACED_ERROR = "Unistyles: this runtime was replaced (reload in progress)";
static const std::string WORKLET_ACCESS_ERROR = R"(Unistyles: styles can't be read inside a worklet (eg. useAnimatedStyle)!

Pass them next to the animated style instead: style={[styles.box, animatedStyle]}. Use useAnimatedTheme to read the theme in a worklet.)";

}
