package com.Ameender.qurantracker.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.dp

internal enum class ReadingDemoUnit(val id: String) { SURAH("surah"), HIZB("hizb"), RUB("rub"), JUZ("juz") }

/** Deliberately has no ViewModel, repository, Context or registration callback. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingReadingPreview(language: String) {
    val text = AppText.strings(language)
    var selected by rememberSaveable { mutableStateOf(ReadingDemoUnit.HIZB) }
    var counts by rememberSaveable { mutableStateOf(listOf(3, 3, 3, 3)) }
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
        FlowRow(
            modifier = Modifier.fillMaxWidth().selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.md),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
        ) {
            ReadingDemoUnit.entries.forEach { unit ->
                Surface(shape = RoundedCornerShape(AppShape.control),
                    color = if (selected == unit) StrongGoldSurface else AppColor.surface,
                    border = BorderStroke(AppBorder.thin, if (selected == unit) AppColor.primary else AppColor.border)) {
                    Box(Modifier.heightIn(min = 48.dp)
                        .testTag("reading_demo_${unit.id}")
                        .selectable(selected == unit, role = Role.Tab, onClick = { selected = unit })
                        .padding(horizontal = AppSpacing.card, vertical = AppSpacing.list)) {
                        Text(text.t("unit.${unit.id}"), style = AppTextStyle.body, color = AppColor.textPrimary)
                    }
                }
            }
        }
        Surface(shape = RoundedCornerShape(AppShape.card), color = AppColor.surface,
            border = BorderStroke(AppBorder.thin, AppColor.border), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(AppSpacing.card), verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
                Text(text.t("onboarding.reading.demo"), style = AppTextStyle.bodySmall, color = AppColor.textSecondary)
                Text(text.t("onboarding.reading.${selected.id}.name"), style = AppTextStyle.sectionTitle,
                    color = AppColor.textPrimary, modifier = Modifier.testTag("reading_demo_name"))
                Text(text.t("onboarding.reading.${selected.id}.passage"), style = AppTextStyle.body,
                    color = AppColor.textSecondary)
                Text(text.t("onboarding.reading.count", counts[selected.ordinal]),
                    style = AppTextStyle.pageTitle, color = AppColor.primary,
                    modifier = Modifier.testTag("reading_demo_count").semantics { liveRegion = LiveRegionMode.Polite })
                QuranSecondaryButton(text.t("onboarding.reading.register"), {
                    counts = counts.mapIndexed { index, count -> if (index == selected.ordinal) count + 1 else count }
                }, modifier = Modifier.fillMaxWidth().testTag("reading_demo_register"), multiline = true)
            }
        }
        Text(text.t("onboarding.reading.quickCheck"), style = AppTextStyle.body,
            color = AppColor.textSecondary, modifier = Modifier.testTag("reading_demo_quick_check"))
    }
}
