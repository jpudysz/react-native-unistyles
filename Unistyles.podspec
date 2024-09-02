require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Unistyles"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported, :osx => "10.14", :tvos => "9.0", :visionos => "1.0" }
  s.source       = { :git => package["repository"], :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{swift,h,mm}",
    "cxx/**/*.{h,cpp,hpp}"
  ]
  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20"
  }

  s.public_header_files = [
    "ios/Unistyles.h"
  ]

  load 'nitrogen/generated/ios/Unistyles+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end