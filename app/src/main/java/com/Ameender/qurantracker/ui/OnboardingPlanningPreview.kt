package com.Ameender.qurantracker.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

internal data class PlanningDemoItem(val unit: String, val date: LocalDate, val minute: Int, val reminder: Boolean) {
    fun validAt(now: LocalDateTime): Boolean = !date.isBefore(now.toLocalDate()) &&
        (!reminder || date.atTime(minute / 60, minute % 60).isAfter(now))
}

internal fun planningDemoDate(date: LocalDate, language: String): String =
    date.format(DateTimeFormatter.ofPattern("EEE d MMM", Locale.forLanguageTag(language)))

/** No ViewModel, scheduler, notification manager or database: one replaceable local example only. */
@Composable
fun OnboardingPlanningPreview(language: String) {
    val text = AppText.strings(language)
    var unit by remember { mutableStateOf("hizb") }
    var date by remember { mutableStateOf(LocalDate.now().plusDays(1)) }
    var minute by remember { mutableIntStateOf(19 * 60) }
    var reminder by remember { mutableStateOf(true) }
    var planned by remember { mutableStateOf<PlanningDemoItem?>(null) }
    var choosing by remember { mutableStateOf<String?>(null) }
    var invalid by remember { mutableStateOf(false) }
    val draft = PlanningDemoItem(unit, date, minute, reminder)
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
        Text(text.t("onboarding.reading.demo"), style = AppTextStyle.bodySmall, color = AppColor.textSecondary)
        Surface(color = AppColor.surface, shape = RoundedCornerShape(AppShape.card),
            border = BorderStroke(AppBorder.thin, AppColor.border)) {
            Column(Modifier.fillMaxWidth().padding(AppSpacing.card), verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                Text(text.t("onboarding.planning.form"), style = AppTextStyle.sectionTitle, color = AppColor.textPrimary)
                QuranSecondaryButton(text.t("onboarding.planning.part", text.t("onboarding.planning.$unit")),
                    { choosing = "unit" }, Modifier.fillMaxWidth().testTag("planning_demo_unit"), multiline = true)
                QuranSecondaryButton(text.t("onboarding.planning.date", planningDemoDate(date, language)),
                    { choosing = "date" }, Modifier.fillMaxWidth().testTag("planning_demo_date"), multiline = true)
                Row(Modifier.fillMaxWidth().testTag("planning_demo_reminder")
                    .toggleable(reminder, role = Role.Switch, onValueChange = { reminder = it; invalid = false }),
                    verticalAlignment = Alignment.CenterVertically) {
                    Text(text.t("onboarding.planning.reminder"), Modifier.weight(1f),
                        style = AppTextStyle.body, color = AppColor.textPrimary)
                    Switch(checked = reminder, onCheckedChange = null)
                }
                NotificationTime(text.t("onboarding.planning.time"), minute, language, reminder) { minute = it; invalid = false }
                if (invalid) Text(text.t("onboarding.planning.invalid"), color = AppColor.danger,
                    modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                QuranSecondaryButton(text.t("onboarding.planning.schedule"), {
                    invalid = !draft.validAt(LocalDateTime.now())
                    if (!invalid) planned = draft
                }, Modifier.fillMaxWidth().testTag("planning_demo_schedule"), multiline = true)
            }
        }
        planned?.let { item ->
            Surface(color = TodayDoneSurface, shape = RoundedCornerShape(AppShape.card), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(AppSpacing.card).testTag("planning_demo_result").semantics { liveRegion = LiveRegionMode.Polite },
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    Text(text.t("onboarding.planning.planned"), style = AppTextStyle.cardTitle, color = AppColor.textPrimary)
                    Text(text.t("onboarding.planning.${item.unit}"), color = AppColor.textPrimary)
                    Text(planningDemoDate(item.date, language) + if (item.reminder)
                        " · " + String.format(Locale.forLanguageTag(language), "%02d:%02d", item.minute / 60, item.minute % 60) else "",
                        color = AppColor.textPrimary)
                    Text(text.t(if (item.reminder) "onboarding.planning.reminderOn" else "onboarding.planning.reminderOff"),
                        style = AppTextStyle.bodySmall, color = AppColor.textPrimary)
                }
            }
        }
        Text(text.t("onboarding.planning.help"), style = AppTextStyle.body, color = AppColor.textSecondary)
    }
    choosing?.let { field ->
        AlertDialog(onDismissRequest = { choosing = null }, containerColor = MidNavy,
            title = { Text(text.t(if (field == "unit") "onboarding.planning.choosePart" else "onboarding.planning.chooseDate")) },
            text = {
                Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    if (field == "unit") listOf("hizb", "juz", "surah").forEach { choice ->
                        QuranSecondaryButton(text.t("onboarding.planning.$choice"), { unit = choice; choosing = null },
                            Modifier.fillMaxWidth().testTag("planning_demo_choose_$choice"), multiline = true)
                    } else (0L..2L).forEach { offset ->
                        val day = LocalDate.now().plusDays(offset)
                        QuranSecondaryButton(planningDemoDate(day, language), { date = day; invalid = false; choosing = null },
                            Modifier.fillMaxWidth().testTag("planning_demo_day_$offset"), multiline = true)
                    }
                }
            }, confirmButton = {}, dismissButton = {
                TextButton(onClick = { choosing = null }) { Text(text.t("common.cancel")) }
            })
    }
}
