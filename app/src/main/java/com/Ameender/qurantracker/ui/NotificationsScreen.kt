package com.Ameender.qurantracker.ui

import android.app.TimePickerDialog
import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.viewmodel.compose.viewModel
import com.Ameender.qurantracker.notifications.*

@Composable
internal fun NotificationsScreen(language: String, model: NotificationsViewModel = viewModel()) {
    val state by model.state.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = androidx.compose.ui.platform.LocalLifecycleOwner.current
    fun notificationsAllowed(): Boolean {
        val manager = NotificationManagerCompat.from(context)
        return manager.areNotificationsEnabled() && manager.getNotificationChannel(NotificationCoordinator.CHANNEL)?.importance != android.app.NotificationManager.IMPORTANCE_NONE
    }
    var permission by remember { mutableStateOf(notificationsAllowed()) }
    var openedGroup by remember { mutableStateOf<String?>(null) }
    fun t(key: String) = notificationText(language, key)
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_RESUME) {
            permission = notificationsAllowed()
        } }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }
    val prefs = state.preferences
    if (prefs == null) { Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }; return }
    Column(Modifier.fillMaxSize().background(DarkNavy).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 12.dp)) {
        if (!permission) {
            Text(t("blocked"), color = GoldLight)
            TextButton(onClick = { context.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)) }) { Text(t("system")) }
        }
        state.status?.let { Text(t(it), style = MaterialTheme.typography.bodySmall, color = if (it == "error") MaterialTheme.colorScheme.error else MutedGold) }
        NotificationSection(t("general"))
        NotificationToggle(t("all"), prefs.enabled, !state.saving) { model.save(prefs.copy(enabled = it)) }
        NotificationToggle(t("quiet"), prefs.quiet.enabled, !state.saving && prefs.enabled) { model.save(prefs.copy(quiet = prefs.quiet.copy(enabled = it))) }
        if (prefs.quiet.enabled) {
            NotificationTime(t("from"), prefs.quiet.startMinute, language, !state.saving && prefs.enabled) { model.save(prefs.copy(quiet = prefs.quiet.copy(startMinute = it))) }
            NotificationTime(t("until"), prefs.quiet.endMinute, language, !state.saving && prefs.enabled) { model.save(prefs.copy(quiet = prefs.quiet.copy(endMinute = it))) }
        }
        Text(t("timing"), style = MaterialTheme.typography.bodySmall, color = MutedGold, modifier = Modifier.padding(vertical = 8.dp))
        NotificationSection(t("daily"))
        NotificationToggle(t("reminder"), prefs.daily, !state.saving && prefs.enabled) { model.save(prefs.copy(daily = it)) }
        NotificationTime(t("time"), prefs.dailyMinute, language, !state.saving && prefs.enabled && prefs.daily) { model.save(prefs.copy(dailyMinute = it)) }
        NotificationToggle(t("extra"), prefs.extra, !state.saving && prefs.enabled) { model.save(prefs.copy(extra = it)) }
        if (prefs.extra) NotificationTime(t("time"), prefs.extraMinute, language, !state.saving && prefs.enabled) { model.save(prefs.copy(extraMinute = it)) }
        NotificationSection(t("planning"))
        NotificationToggle(t("planningOn"), prefs.planning, !state.saving && prefs.enabled) { model.save(prefs.copy(planning = it)) }
        Text(t("planningHelp"), color = MutedGold, style = MaterialTheme.typography.bodySmall)
        NotificationSection(t("groups"))
        Text(t("pushPending"), color = MutedGold, style = MaterialTheme.typography.bodySmall)
        if (!state.signedIn && !state.authChecking) Text(t("login"), modifier = Modifier.padding(vertical = 12.dp), color = GoldLight)
        if (state.groupsLoading || state.authChecking) LinearProgressIndicator(Modifier.fillMaxWidth().padding(vertical = 12.dp))
        if (state.groupsError) {
            Text(t("loadError"), color = MaterialTheme.colorScheme.error)
            TextButton(onClick = model::retryGroups, enabled = !state.groupsLoading) { Text(t("retry")) }
        }
        state.groupPush?.let { group ->
            NotificationToggle(t("groupOn"), group.enabled, !state.saving) { model.saveGroupPush(group.copy(enabled = it)) }
            val enabled = group.enabled && !state.saving
            NotificationToggle(t("mention"), group.mention, enabled) { model.saveGroupPush(group.copy(mention = it)) }
            NotificationToggle(t("reaction"), group.reaction, enabled) { model.saveGroupPush(group.copy(reaction = it)) }
            NotificationToggle(t("announcement"), group.announcement, enabled) { model.saveGroupPush(group.copy(announcement = it)) }
            NotificationToggle(t("invitation"), group.invitation, enabled) { model.saveGroupPush(group.copy(invitation = it)) }
            NotificationToggle(t("join_request"), group.joinRequest, enabled) { model.saveGroupPush(group.copy(joinRequest = it)) }
            NotificationToggle(t("update"), group.update, enabled) { model.saveGroupPush(group.copy(update = it)) }
        }
        if (state.groups.isNotEmpty()) NotificationSection(t("perGroup"))
        state.groups.forEach { group ->
            TextButton(onClick = { openedGroup = group.code; model.loadOverride(group.code) }, enabled = !state.saving, modifier = Modifier.fillMaxWidth()) {
                Text(group.name, modifier = Modifier.weight(1f))
                Text("›")
            }
        }
        Spacer(Modifier.height(24.dp))
    }
    openedGroup?.let { code ->
        val override = state.overrides[code]
        AlertDialog(onDismissRequest = { openedGroup = null }, title = { Text(state.groups.find { it.code == code }?.name.orEmpty()) }, text = {
            Column {
                if (override == null && state.saving) CircularProgressIndicator()
                else if (override == null) TextButton(onClick = { model.loadOverride(code) }) { Text(t("retry")) }
                else listOf("all" to "allMode", "important" to "important", "mentions" to "mentions", "muted" to "muted").forEach { (mode, key) ->
                    Row(Modifier.fillMaxWidth().clickable(enabled = !state.saving) { model.saveOverride(code, mode) }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = override.level == mode, onClick = null)
                        Text(t(key), modifier = Modifier.padding(start = 8.dp), color = GoldLight)
                    }
                }
                if (state.status == "error") Text(t("error"), color = MaterialTheme.colorScheme.error)
            }
        }, confirmButton = { TextButton(onClick = { openedGroup = null }) { Text("OK") } })
    }
}

@Composable
private fun NotificationSection(title: String) {
    HorizontalDivider(Modifier.padding(top = 18.dp, bottom = 12.dp), color = BorderNavy)
    Text(title, style = MaterialTheme.typography.titleSmall, color = Gold, modifier = Modifier.padding(bottom = 4.dp))
}
@Composable
private fun NotificationToggle(title: String, checked: Boolean, enabled: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 56.dp).toggleable(value = checked, enabled = enabled, role = Role.Switch, onValueChange = onChange), verticalAlignment = Alignment.CenterVertically) {
        Text(title, Modifier.weight(1f).padding(end = 12.dp), color = if (enabled) GoldLight else MutedGold)
        Switch(checked = checked, onCheckedChange = null, enabled = enabled)
    }
}
@Composable
private fun NotificationTime(title: String, minute: Int, language: String, enabled: Boolean, onChange: (Int) -> Unit) {
    val context = LocalContext.current
    val locale = java.util.Locale.forLanguageTag(language)
    val label = String.format(locale, "%02d:%02d", minute / 60, minute % 60)
    Row(Modifier.fillMaxWidth().heightIn(min = 52.dp).clickable(enabled = enabled) {
        TimePickerDialog(context.createConfigurationContext(android.content.res.Configuration(context.resources.configuration).apply { setLocale(locale) }),
            { _, hour, min -> onChange(hour * 60 + min) }, minute / 60, minute % 60, true).show()
    }, verticalAlignment = Alignment.CenterVertically) {
        Text(title, Modifier.weight(1f), color = if(enabled) GoldLight else MutedGold)
        Text(label, color = MutedGold)
    }
}
