package com.Ameender.qurantracker.data

import android.content.Context
import android.content.Intent
import java.util.Locale

/** Local delivery state, separate from authentication and onboarding completion. */
class PendingNavigationStore(context: Context) {
    private val prefs = context.getSharedPreferences("pending_navigation", Context.MODE_PRIVATE)
    val groupCode get() = prefs.getString("group_code", null)
    val groupToken get() = prefs.getString("group_token", null)
    val notification get() = prefs.getString("notification", null)

    fun receive(intent: Intent) {
        val uri = intent.data ?: return
        if (!uri.isHierarchical) return
        if (uri.userInfo != null || uri.port != -1) return
        val group = (uri.scheme == SupabaseConfig.DEEPLINK_SCHEME && uri.host == "group") ||
            (uri.scheme == "https" && uri.host == "qurantracker.app" && uri.pathSegments.firstOrNull() == "group")
        if (group) {
            val code = (if (uri.scheme == "https") uri.pathSegments.getOrNull(1) else uri.pathSegments.firstOrNull())
                ?.trim()?.uppercase(Locale.ROOT)?.takeIf { Regex("^[A-Z0-9]{3}-[0-9]{4}$").matches(it) }
            val token = uri.getQueryParameter("invite")?.trim()?.takeIf { it.length in 32..160 }
            if (uri.getQueryParameters("invite").size > 1 ||
                (uri.getQueryParameter("invite") != null && token == null)) return
            // Reject malformed links rather than replacing a valid invitation awaiting login.
            if (uri.pathSegments.size != (if (uri.scheme == "https") 2 else 1)) return
            receive(code, token, null)
        } else if (uri.scheme == "qurantracker" && uri.host == "notification") {
            val route = uri.pathSegments.firstOrNull()?.takeIf { it == "daily_goal" || it == "agenda" } ?: return
            val id = uri.pathSegments.getOrNull(1)?.toIntOrNull()?.takeIf { it > 0 }
            receive(null, null, if (route == "agenda" && id != null) "agenda?itemId=$id" else route)
        }
    }

    // An auth callback or launcher intent must not erase an invitation waiting for login.
    fun receive(code: String?, token: String?, route: String?) {
        val edit = prefs.edit()
        if (code != null || token != null) {
            edit.putString("group_code", code).putString("group_token", token)
        }
        if (route != null) edit.putString("notification", route)
        edit.apply()
    }

    fun consumeGroup(code: String?, token: String?) {
        if (groupCode == code && groupToken == token) {
            prefs.edit().remove("group_code").remove("group_token").apply()
        }
    }
    fun consumeNotification(route: String?) {
        if (notification == route) prefs.edit().remove("notification").apply()
    }
}
