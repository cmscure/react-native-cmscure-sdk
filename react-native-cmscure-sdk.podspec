# cmscure-sdk-native-module/react-native-cmscure-sdk.podspec

require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-cmscure-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/cmscure/react-native-cmscure-sdk"
  s.license      = package["license"]
  s.authors      = { "Hamza Hasan" => "support@cmscure.com" }
  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => "https://github.com/cmscure/react-native-cmscure-sdk.git", :tag => "#{s.version}" }

  s.source_files  = "ios/**/*.{h,m,mm,swift}"

  # Dependencies
  s.dependency "React-Core"
  s.dependency "Socket.IO-Client-Swift", "~> 16.1.0"
  s.dependency "Kingfisher", "~> 7.0"

  s.swift_version = "5.0"
end