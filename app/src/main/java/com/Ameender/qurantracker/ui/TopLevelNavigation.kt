package com.Ameender.qurantracker.ui

import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController

/** Restore the tab's state, but do not reopen a child such as the Quran reader. */
internal fun NavHostController.navigateToTopLevel(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
    // Restored stacks can contain Hizb -> Reader; a tab click requests Hizb itself.
    popBackStack(route, inclusive = false)
}
