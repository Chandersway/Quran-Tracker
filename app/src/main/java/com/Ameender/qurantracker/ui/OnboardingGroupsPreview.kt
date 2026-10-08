package com.Ameender.qurantracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*

/** Fictitious display values only: no group IDs, memberships, posts or backend models. */
internal val onboardingGroupPoints = listOf("yusuf" to 240, "ahmed" to 180, "ibrahim" to 120)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OnboardingGroupsPreview(language: String) {
    val text = AppText.strings(language)
    var feedback by remember { mutableStateOf<String?>(null) }
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
        Text(text.t("onboarding.reading.demo"), style = AppTextStyle.bodySmall, color = AppColor.textSecondary)
        QuranAppCard {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                Icon(Icons.Default.Groups, contentDescription = null, tint = AppColor.primary, modifier = Modifier.size(AppIcon.xl))
                Column {
                    Text(text.t("onboarding.groups.name"), style = AppTextStyle.sectionTitle, color = AppColor.textPrimary)
                    Text(text.t("onboarding.groups.members", 3), style = AppTextStyle.bodySmall, color = AppColor.textSecondary)
                }
            }
            Spacer(Modifier.height(AppSpacing.list))
            Text(text.t("onboarding.groups.feed"), style = AppTextStyle.cardTitle, color = AppColor.primary)
            Text(text.t("onboarding.groups.yusuf"), style = AppTextStyle.cardTitle, color = AppColor.textPrimary)
            Text(text.t("onboarding.groups.message"), style = AppTextStyle.body, color = AppColor.textPrimary)
            Spacer(Modifier.height(AppSpacing.list))
            HorizontalDivider(color = AppColor.border)
            Spacer(Modifier.height(AppSpacing.list))
            Text(text.t("group.leaderboard"), style = AppTextStyle.sectionTitle, color = AppColor.textPrimary)
            Text(text.t("onboarding.groups.pointsHelp"), style = AppTextStyle.bodySmall, color = AppColor.textSecondary)
            onboardingGroupPoints.forEachIndexed { index, (name, points) ->
                FlowRow(Modifier.fillMaxWidth().padding(top = AppSpacing.md).testTag("groups_demo_$name")
                    .semantics(mergeDescendants = true) {}, horizontalArrangement = Arrangement.SpaceBetween,
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.xs)) {
                    Text(text.t("onboarding.groups.position", index + 1, text.t("onboarding.groups.$name")),
                        style = AppTextStyle.body, color = AppColor.textPrimary, modifier = Modifier.padding(end = AppSpacing.md))
                    Text(text.t("onboarding.groups.points", points), style = AppTextStyle.cardTitle,
                        color = AppColor.primary, modifier = Modifier.testTag("groups_demo_points_$name"))
                }
            }
        }
        QuranSecondaryButton(text.t("onboarding.groups.create"), { feedback = "createInfo" },
            Modifier.fillMaxWidth().testTag("groups_demo_create"), multiline = true)
        QuranSecondaryButton(text.t("onboarding.groups.join"), { feedback = "joinInfo" },
            Modifier.fillMaxWidth().testTag("groups_demo_join"), multiline = true)
        feedback?.let {
            Text(text.t("onboarding.groups.$it"), style = AppTextStyle.body, color = AppColor.textSecondary,
                modifier = Modifier.testTag("groups_demo_feedback").semantics { liveRegion = LiveRegionMode.Polite })
        }
    }
}
