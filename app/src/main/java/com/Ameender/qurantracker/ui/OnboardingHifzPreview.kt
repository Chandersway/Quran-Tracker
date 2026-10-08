package com.Ameender.qurantracker.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import kotlin.math.roundToInt

/** Presentation-only demo: no repository, ViewModel, context or persistence callbacks. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingHifzPreview(language: String) {
    val text = AppText.strings(language)
    var score by rememberSaveable { mutableIntStateOf(75) }
    var draft by rememberSaveable { mutableIntStateOf(75) }
    var editing by rememberSaveable { mutableStateOf(false) }
    val open = { draft = score; editing = true }
    val scoreLabel = if (score == 0) text.t("onboarding.hifz.unrated") else text.t("onboarding.hifz.score", score)
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
        Text(text.t("onboarding.reading.demo"), style = AppTextStyle.bodySmall, color = AppColor.textSecondary)
        Surface(
            color = hifzScoreSurface(score),
            border = BorderStroke(AppBorder.thin, hifzScoreBorder(score)),
            shape = RoundedCornerShape(AppShape.card),
            modifier = Modifier.fillMaxWidth().testTag("hifz_demo_card")
                .combinedClickable(role = Role.Button, onClickLabel = text.t("onboarding.hifz.edit"),
                    onLongClickLabel = text.t("onboarding.hifz.edit"), onClick = open, onLongClick = open)
                .semantics { stateDescription = scoreLabel }
        ) {
            Column(Modifier.padding(AppSpacing.card), verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
                Text(text.t("common.hizbNumber", 1), style = AppTextStyle.sectionTitle, color = AppColor.textPrimary)
                Text(scoreLabel, style = AppTextStyle.pageTitle, color = AppColor.textPrimary,
                    modifier = Modifier.testTag("hifz_demo_score"))
                Text(text.t("onboarding.hifz.hold"), style = AppTextStyle.body, color = AppColor.textPrimary)
            }
        }
        Text(text.t("onboarding.hifz.zero"), style = AppTextStyle.body, color = AppColor.textSecondary)
    }
    if (editing) {
        AlertDialog(
            onDismissRequest = { editing = false },
            containerColor = MidNavy, titleContentColor = GoldLight, textContentColor = LabelGold,
            title = { Text(text.t("common.hizbNumber", 1)) },
            text = {
                Column(Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
                    Text(text.t("onboarding.hifz.value", draft), style = AppTextStyle.pageTitle,
                        color = Gold, modifier = Modifier.testTag("hifz_demo_draft"))
                    Slider(value = draft.toFloat(), onValueChange = { draft = it.roundToInt().coerceIn(0, 100) },
                        valueRange = 0f..100f, steps = 99,
                        modifier = Modifier.testTag("hifz_demo_slider").semantics {
                            contentDescription = text.t("onboarding.hifz.edit")
                            stateDescription = if (draft == 0) text.t("onboarding.hifz.unrated")
                                else text.t("onboarding.hifz.value", draft)
                        })
                    Text(text.t("onboarding.hifz.zero"), style = AppTextStyle.body)
                    Text(text.t("onboarding.reading.demo"), style = AppTextStyle.bodySmall)
                }
            },
            confirmButton = {
                TextButton(onClick = { score = draft; editing = false }, modifier = Modifier.testTag("hifz_demo_save")) {
                    Text(text.t("common.save"), color = Gold)
                }
            },
            dismissButton = {
                Column {
                    TextButton(onClick = { score = 0; editing = false }, modifier = Modifier.testTag("hifz_demo_clear")) {
                        Text(text.t("hifz.clear"), color = DeleteRed)
                    }
                    TextButton(onClick = { editing = false }, modifier = Modifier.testTag("hifz_demo_cancel")) {
                        Text(text.t("common.cancel"), color = MutedGold)
                    }
                }
            }
        )
    }
}
