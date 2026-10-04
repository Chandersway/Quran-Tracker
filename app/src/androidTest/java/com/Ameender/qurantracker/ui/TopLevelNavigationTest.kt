package com.Ameender.qurantracker.ui

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TopLevelNavigationTest {
    @get:Rule val compose = createComposeRule()
    @Test fun hizbTabRestoresOverviewNotItsReaderChild() {
        lateinit var nav: NavHostController
        compose.setContent {
            nav = rememberNavController()
            NavHost(nav, startDestination = "home") {
                listOf("home", "hizb", "reader", "stats").forEach { route -> composable(route) {} }
            }
        }
        compose.runOnIdle { nav.navigateToTopLevel("hizb") }
        compose.runOnIdle { nav.navigate("reader") }
        compose.runOnIdle { nav.navigateToTopLevel("stats") }
        compose.runOnIdle { nav.navigateToTopLevel("hizb") }
        compose.runOnIdle { assertEquals("hizb", nav.currentDestination?.route) }
        compose.runOnIdle { nav.navigate("reader") }
        compose.runOnIdle { assertEquals("reader", nav.currentDestination?.route) }
        compose.runOnIdle { nav.navigateToTopLevel("hizb") }
        compose.runOnIdle { assertEquals("hizb", nav.currentDestination?.route) }
    }
}
