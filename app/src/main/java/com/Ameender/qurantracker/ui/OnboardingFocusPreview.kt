package com.Ameender.qurantracker.ui

import android.os.SystemClock
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay

@Composable
fun OnboardingFocusPreview(language: String) {
    // Intentionally ephemeral: reopening/rotation starts a fresh demo, never a background session.
    var timer by remember { mutableStateOf(FocusDemoTimer()) }
    val owner = LocalLifecycleOwner.current
    val text = AppText.strings(language)
    LaunchedEffect(owner, timer.running) {
        if (timer.running) owner.lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            try {
                while (timer.running) {
                    delay(1000)
                    timer = timer.sample(SystemClock.elapsedRealtime())
                }
            } finally {
                timer = timer.pause(SystemClock.elapsedRealtime())
            }
        }
    }
    val status = when {
        timer.remainingMs == 0L -> "finished"
        timer.running -> "reading"
        timer.hasStarted -> "paused"
        else -> "ready"
    }
    val action = when {
        timer.running -> "pause"
        timer.remainingMs == 0L -> "restart"
        timer.hasStarted -> "resume"
        else -> "start"
    }
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
        Text(text.t("onboarding.reading.demo"), style = AppTextStyle.bodySmall, color = AppColor.textSecondary)
        Surface(color = AppColor.surface, shape = RoundedCornerShape(AppShape.card),
            border = BorderStroke(AppBorder.thin, AppColor.border)) {
            Column(Modifier.fillMaxWidth().padding(AppSpacing.card), verticalArrangement = Arrangement.spacedBy(AppSpacing.list)) {
                Text(text.t("onboarding.pomodoro.focus"), style = AppTextStyle.sectionTitle, color = AppColor.textPrimary)
                Text(text.t("onboarding.pomodoro.$status"), style = AppTextStyle.body, color = AppColor.textSecondary,
                    modifier = Modifier.testTag("focus_demo_status"))
                Text(formatFocusTime(timer.seconds), style = AppTextStyle.pageTitle.copy(fontSize = 36.sp),
                    color = AppColor.textPrimary, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().testTag("focus_demo_time").clearAndSetSemantics {
                        contentDescription = text.t("onboarding.pomodoro.remaining", timer.seconds / 60, timer.seconds % 60)
                    })
                LinearProgressIndicator(progress = { 1f - timer.remainingMs.toFloat() / FocusDemoTimer.DURATION_MS },
                    color = AppColor.primary, trackColor = AppColor.border,
                    modifier = Modifier.fillMaxWidth().clearAndSetSemantics {})
                QuranSecondaryButton(text.t("onboarding.pomodoro.$action"), {
                    if (owner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) {
                        timer = timer.toggle(SystemClock.elapsedRealtime())
                    }
                }, modifier = Modifier.fillMaxWidth().testTag("focus_demo_toggle"), multiline = true)
            }
        }
        Text(text.t("onboarding.pomodoro.phases"), style = AppTextStyle.body, color = AppColor.textSecondary)
    }
}
