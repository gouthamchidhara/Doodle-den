import ExpoModulesCore
import UIKit

// Uptime, boot id and Guided Access state for the Doodle Den time lock (A4).
public class LockNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LockNative")

    Function("getUptimeMs") { () -> Double in
      Double(clock_gettime_nsec_np(CLOCK_MONOTONIC)) / 1_000_000
    }

    Function("getBootId") { () -> String in
      var tv = timeval()
      var size = MemoryLayout<timeval>.stride
      var mib: [Int32] = [CTL_KERN, KERN_BOOTTIME]
      if sysctl(&mib, 2, &tv, &size, nil, 0) != 0 {
        return "unknown"
      }
      return String(tv.tv_sec)
    }

    Function("isPinned") { () -> Bool in
      if Thread.isMainThread {
        return UIAccessibility.isGuidedAccessEnabled
      }
      return DispatchQueue.main.sync { UIAccessibility.isGuidedAccessEnabled }
    }

    AsyncFunction("startPinning") { () -> Bool in
      false
    }

    AsyncFunction("stopPinning") { () -> Void in
    }
  }
}
