package com.Ameender.qurantracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics

/** Static presentation examples, never ReadingHistory entities or database-backed state. */
internal data class DemoReadCount(val id: String, val nameKey: String, val count: Int)
internal val onboardingReadCounts = listOf(
    DemoReadCount("hizb", "onboarding.reading.hizb.name", 5),
    DemoReadCount("juz", "onboarding.reading.juz.name", 2),
    DemoReadCount("surah", "onboarding.reading.surah.passage", 3)
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingStatisticsPreview(language: String) {
    val text = AppText.strings(language)
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
        Text(text.t("onboarding.reading.demo"), style = AppTextStyle.bodySmall, color = AppColor.textSecondary)
        QuranAppCard {
            Text(text.t("onboarding.statistics.activity"), style = AppTextStyle.sectionTitle, color = AppColor.textPrimary)
            Spacer(Modifier.height(AppSpacing.md))
            Text(text.t("onboarding.statistics.repetitions"), style = AppTextStyle.body, color = AppColor.textSecondary)
            onboardingReadCounts.forEachIndexed { index, item ->
                Spacer(Modifier.height(AppSpacing.card))
                if (index > 0) {
                    HorizontalDivider(color = AppColor.border)
                    Spacer(Modifier.height(AppSpacing.card))
                }
                // Wrap onto a second line at large font scales instead of clipping either label.
                FlowRow(Modifier.fillMaxWidth().testTag("stats_demo_${item.id}").semantics(mergeDescendants = true) {},
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    Text(text.t(item.nameKey), style = AppTextStyle.sectionTitle, color = AppColor.textPrimary,
                        modifier = Modifier.padding(end = AppSpacing.list))
                    Text(text.t("onboarding.reading.count", item.count), style = AppTextStyle.sectionTitle,
                        color = AppColor.primary, modifier = Modifier.testTag("stats_demo_count_${item.id}"))
                }
            }
        }
        Text(text.t("onboarding.statistics.repeatHelp"), style = AppTextStyle.body, color = AppColor.textSecondary)
    }
}
