package com.Ameender.qurantracker.ui

import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.Ameender.qurantracker.data.OnboardingStep

/** Voluntary presentation: never writes first-run progress, preferences or completion. */
@Composable
fun OnboardingReplay(language: String, onClose: () -> Unit) {
    var stepId by rememberSaveable { mutableStateOf(OnboardingStep.READING.id) }
    Dialog(onDismissRequest = onClose, properties = DialogProperties(
        usePlatformDefaultWidth = false, dismissOnClickOutside = false, decorFitsSystemWindows = false
    )) {
        OnboardingShell(language, OnboardingStep.fromId(stepId),
            onStepChange = { stepId = it.id }, onReturnToLanguage = onClose, onComplete = onClose)
    }
}
