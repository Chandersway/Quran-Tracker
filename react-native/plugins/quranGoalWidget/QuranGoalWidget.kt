package com.Ameender.qurantracker

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Home-screen widget for today's reading goal. The app computes every text and
 * writes one JSON snapshot; this side only picks today's or the next day's view
 * (after midnight with the app closed a new day starts at zero) and draws it.
 */
object QuranGoalWidgetStore {
  private const val PREFS = "quran_goal_widget"
  private const val KEY = "snapshot"

  fun save(context: Context, json: String) {
    JSONObject(json) // reject malformed input before it replaces a good snapshot
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
  }

  fun load(context: Context): JSONObject? =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)?.let {
      try { JSONObject(it) } catch (_: Exception) { null }
    }
}

class QuranGoalWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    render(context, manager, ids)
    scheduleMidnight(context)
  }

  override fun onEnabled(context: Context) = scheduleMidnight(context)

  override fun onDisabled(context: Context) {
    alarmManager(context)?.cancel(refreshIntent(context))
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    when (intent.action) {
      ACTION_REFRESH, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED,
      Intent.ACTION_DATE_CHANGED, Intent.ACTION_MY_PACKAGE_REPLACED -> refreshAll(context)
    }
  }

  companion object {
    const val ACTION_REFRESH = "com.Ameender.qurantracker.QURAN_GOAL_WIDGET_REFRESH"

    fun refreshAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, QuranGoalWidgetProvider::class.java))
      if (ids.isNotEmpty()) {
        render(context, manager, ids)
        scheduleMidnight(context)
      }
    }

    private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    private fun render(context: Context, manager: AppWidgetManager, ids: IntArray) {
      val snapshot = QuranGoalWidgetStore.load(context)
      for (id in ids) manager.updateAppWidget(id, views(context, snapshot, id))
    }

    private fun views(context: Context, snapshot: JSONObject?, id: Int): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.quran_goal_widget)
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      if (snapshot == null) {
        views.setTextViewText(R.id.quran_goal_widget_title, context.getString(R.string.quran_goal_widget_label))
        views.setTextViewText(R.id.quran_goal_widget_progress, "")
        views.setTextViewText(R.id.quran_goal_widget_status, context.getString(R.string.quran_goal_widget_empty))
        views.setViewVisibility(R.id.quran_goal_widget_bar, View.GONE)
        views.setViewVisibility(R.id.quran_goal_widget_next, View.GONE)
        if (launch != null) views.setOnClickPendingIntent(R.id.quran_goal_widget_root, activity(context, launch, id))
        return views
      }
      val date = today()
      val today = snapshot.optJSONObject("today")
      val tomorrow = snapshot.optJSONObject("tomorrow")
      // A snapshot from an earlier day: today's goal starts empty (or the app has not run yet).
      val day = when (date) {
        today?.optString("date") -> today
        tomorrow?.optString("date") -> tomorrow
        else -> tomorrow ?: today
      }
      val complete = day?.optBoolean("complete") == true
      val fraction = day?.optDouble("fraction", 0.0) ?: 0.0
      views.setTextViewText(R.id.quran_goal_widget_title, snapshot.optString("title"))
      views.setTextViewText(R.id.quran_goal_widget_progress, day?.optString("progressText") ?: "")
      views.setTextViewText(R.id.quran_goal_widget_status, day?.optString("status") ?: "")
      views.setTextColor(
        R.id.quran_goal_widget_status,
        context.getColor(if (complete) R.color.quran_goal_widget_done else R.color.quran_goal_widget_muted),
      )
      views.setViewVisibility(R.id.quran_goal_widget_bar, View.VISIBLE)
      views.setProgressBar(R.id.quran_goal_widget_bar, 1000, (fraction.coerceIn(0.0, 1.0) * 1000).toInt(), false)
      val next = snapshot.optString("next")
      views.setViewVisibility(R.id.quran_goal_widget_next, if (next.isEmpty()) View.GONE else View.VISIBLE)
      views.setTextViewText(R.id.quran_goal_widget_next, next)
      val url = snapshot.optString("url")
      val open = if (url.startsWith("qurantracker://"))
        Intent(Intent.ACTION_VIEW, Uri.parse(url)).setPackage(context.packageName)
      else launch
      if (open != null) views.setOnClickPendingIntent(R.id.quran_goal_widget_root, activity(context, open, id))
      return views
    }

    private fun activity(context: Context, intent: Intent, id: Int): PendingIntent =
      PendingIntent.getActivity(
        context,
        id,
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    private fun alarmManager(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager

    private fun refreshIntent(context: Context): PendingIntent =
      PendingIntent.getBroadcast(
        context,
        0,
        Intent(context, QuranGoalWidgetProvider::class.java).setAction(ACTION_REFRESH),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    /** Inexact (no exact-alarm permission); updatePeriodMillis is the fallback. */
    private fun scheduleMidnight(context: Context) {
      val next = Calendar.getInstance().apply {
        add(Calendar.DAY_OF_YEAR, 1)
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 30)
        set(Calendar.MILLISECOND, 0)
      }
      alarmManager(context)?.set(AlarmManager.RTC, next.timeInMillis, refreshIntent(context))
    }
  }
}

class QuranGoalWidgetModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "QuranGoalWidget"

  @ReactMethod
  fun update(json: String, promise: Promise) {
    try {
      QuranGoalWidgetStore.save(reactApplicationContext, json)
      QuranGoalWidgetProvider.refreshAll(reactApplicationContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("quran_goal_widget", error)
    }
  }
}

class QuranGoalWidgetPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(QuranGoalWidgetModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
