require "json"
require_relative './get_rn_version.rb'

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Unistyles"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => package["repository"], :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{swift,h,mm}",
    "cxx/**/*.{h,cpp,hpp}"
  ]
  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) FOLLY_NO_CONFIG FOLLY_CFG_NO_COROUTINES FOLLY_MOBILE"
  }

  s.public_header_files = [
    "ios/Unistyles.h"
  ]

  if ENV["USE_FRAMEWORKS"]
    RN_VERSION = get_rn_version(ENV['REACT_NATIVE_PATH']) || 999

    s.dependency "React-Core"
    add_dependency(s, "React-jsinspector", :framework_name => "jsinspector_modern")

    if RN_VERSION >= 79
      add_dependency(s, "React-jsinspectortracing", :framework_name => 'jsinspector_moderntracing')
    end

    if RN_VERSION >= 80
      add_dependency(s, "React-jsinspectorcdp", :framework_name => 'jsinspector_moderncdp')
    end

    add_dependency(s, "React-rendererconsistency", :framework_name => "React_rendererconsistency")
  end

  load "nitrogen/generated/ios/Unistyles+autolinking.rb"
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
