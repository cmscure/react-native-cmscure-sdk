require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json"))) # Assuming a package.json in this folder

Pod::Spec.new do |s|
  s.name         = "react-native-cmscure-sdk" # Needs to match the name in package.json for auto-linking
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"] # Link to your package's homepage or repository
  s.license      = package["license"]  # e.g., 'MIT'
  s.authors      = { "Hamza Hasan" => "support@cmscure.com" } # Update with your details
  s.platforms    = { :ios => "13.0" } # Minimum iOS deployment target your SDK supports (CMSCureSDK.swift uses iOS 13+ features like Combine)
  # s.source = { :git => "https://github.com/cmscure/react-native-cmscure-sdk.git", :tag => "#{s.version}" }
  s.source = { :path => "." }
  s.dependency "Socket.IO-Client-Swift", "~> 16.1.0"
  # Source files for your module.
  # This assumes CMSCureSDKModule.swift, CMSCureSDKModule.m, and your CMSCureSDK.swift
  # are directly within the 'ios' folder of this pod.
  s.source_files = "ios/**/*.{h,m,mm,swift}"

  # React Native Core dependencies
  s.dependency "React-Core"
  # Add other dependencies if your native Swift SDK (CMSCureSDK.swift) has them.
  # For example, your CMSCureSDK.swift uses SocketIO and CryptoKit.
  # CryptoKit is part of iOS, so no separate pod.
  # For Socket.IO, your main CMSCureSDK.swift already imports it.
  # If CMSCureSDK.swift is included directly, its dependencies need to be met by the app or this pod.
  # If your CMSCureSDK.swift was an SPM package, you'd handle it differently.
  # For now, assuming the app using this RN SDK will also have Socket.IO client.
  # Or, more robustly, this podspec should declare Socket.IO as a dependency.
  # s.dependency "Socket.IO-Client-Swift", "~> 16.1.0" # Example, use the version your SDK needs

  # Swift version
  s.swift_version = "5.0" # Or the version your Swift code requires

  # This is important for Swift modules
  s.static_framework = true # Recommended for Swift pods to avoid issues with dynamic frameworks in RN.

  # If your pod needs a bridging header (e.g., if CMSCureSDKModule.m needs to see Swift)
  # s.pod_target_xcconfig = { 'SWIFT_OBJC_BRIDGING_HEADER' => '$(PODS_TARGET_SRCROOT)/ios/YourProject-Bridging-Header.h' }
  # However, with RCT_EXTERN_MODULE, a specific bridging header for the pod itself is often not needed
  # if the main app project has one that makes React Native headers available.
end