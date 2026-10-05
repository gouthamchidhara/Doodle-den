Pod::Spec.new do |s|
  s.name           = 'LockNative'
  s.version        = '0.1.0'
  s.summary        = 'Uptime, boot id and Guided Access state for the Doodle Den time lock'
  s.description    = s.summary
  s.author         = 'Doodle Den'
  s.homepage       = 'https://github.com/gouthamchidhara/doodle-den'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '17.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift}'
end
