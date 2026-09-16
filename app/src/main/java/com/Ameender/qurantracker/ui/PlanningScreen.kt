package com.Ameender.qurantracker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.Ameender.qurantracker.viewmodel.GoalViewModel

@Composable
fun PlanningScreen(appLanguage: String = "nl", goalViewModel: GoalViewModel = viewModel()) {
    Column(Modifier.fillMaxSize().background(DarkNavy)
        .verticalScroll(rememberScrollState()).padding(16.dp)) {
        GoalHubPanel(goalViewModel, appLanguage)
    }
}
