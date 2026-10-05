package expo.modules.locknative

import android.app.ActivityManager
import android.content.Context
import android.os.SystemClock
import android.provider.Settings
import expo.modules.kotlin.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Uptime, boot id and app pinning for the Doodle Den time lock (A4).
class LockNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LockNative")

    Function("getUptimeMs") {
      SystemClock.elapsedRealtime().toDouble()
    }

    Function("getBootId") {
      val ctx = appContext.reactContext ?: return@Function "unknown"
      Settings.Global.getInt(ctx.contentResolver, Settings.Global.BOOT_COUNT, -1).toString()
    }

    Function("isPinned") {
      val am = appContext.reactContext?.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
      am != null && am.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
    }

    AsyncFunction("startPinning") {
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      try {
        activity.startLockTask()
        true
      } catch (e: Exception) {
        false
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stopPinning") {
      try {
        appContext.currentActivity?.stopLockTask()
      } catch (e: Exception) {
        // not pinned
      }
      Unit
    }.runOnQueue(Queues.MAIN)
  }
}
