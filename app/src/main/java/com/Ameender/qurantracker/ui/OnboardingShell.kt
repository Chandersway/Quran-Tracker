package com.Ameender.qurantracker.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.data.OnboardingStep

/** Presentation only. The host owns persistence, completion and the existing app navigation. */
@Composable
fun OnboardingShell(
    language: String,
    step: OnboardingStep,
    onStepChange: (OnboardingStep) -> Unit,
    onReturnToLanguage: () -> Unit,
    onComplete: () -> Unit,
    preview: @Composable (OnboardingStep) -> Unit = {
        when (it) {
            OnboardingStep.READING -> OnboardingReadingPreview(language)
            OnboardingStep.HIFZ -> OnboardingHifzPreview(language)
            OnboardingStep.POMODORO -> OnboardingFocusPreview(language)
            OnboardingStep.PLANNING -> OnboardingPlanningPreview(language)
            OnboardingStep.STATISTICS -> OnboardingStatisticsPreview(language)
            OnboardingStep.GROUPS -> OnboardingGroupsPreview(language)
        }
    }
) {
    val text = AppText.strings(language)
    val back = { step.previous?.let(onStepChange) ?: onReturnToLanguage() }
    BackHandler(onBack = back)
    Surface(Modifier.fillMaxSize().testTag("onboarding_shell"), color = AppColor.background) {
        Box(Modifier.safeDrawingPadding(), contentAlignment = Alignment.Center) {
            // All controls scroll together so 200% text never hides the primary action.
            key(step) {
                Column(
                    Modifier.widthIn(max = 480.dp).fillMaxWidth()
                        .verticalScroll(rememberScrollState()).padding(AppSpacing.screen),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.section)
                ) {
                    TextButton(onClick = onComplete,
                        modifier = Modifier.align(Alignment.End).testTag("intro_skip")) {
                        Text(text.t("onboarding.skip"), color = AppColor.primary, style = AppTextStyle.body)
                    }
                    Text(text.t(step.titleKey), style = AppTextStyle.pageTitle,
                        color = AppColor.textPrimary,
                        modifier = Modifier.testTag("intro_title").semantics { heading() })
                    Text(text.t(step.descriptionKey), style = AppTextStyle.body, color = AppColor.textSecondary)
                    preview(step)
                    Row(
                        Modifier.align(Alignment.CenterHorizontally).semantics(mergeDescendants = true) {
                            contentDescription = text.t("onboarding.progress", step.ordinal + 1, OnboardingStep.entries.size)
                        },
                        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
                    ) {
                        OnboardingStep.entries.forEach { item ->
                            Box(Modifier.size(8.dp).background(
                                if (item == step) AppColor.primary else AppColor.borderStrong, CircleShape
                            ).testTag("intro_dot_${item.id}").semantics { selected = item == step })
                        }
                    }
                    QuranPrimaryButton(
                        text.t(if (step.next == null) "onboarding.start" else "onboarding.next"),
                        onClick = { step.next?.let(onStepChange) ?: onComplete() },
                        modifier = Modifier.fillMaxWidth().testTag("intro_next")
                    )
                    if (step.previous != null) {
                        QuranSecondaryButton(text.t("onboarding.previous"), back,
                            modifier = Modifier.fillMaxWidth().testTag("intro_previous"))
                    }
                }
            }
        }
    }
}

