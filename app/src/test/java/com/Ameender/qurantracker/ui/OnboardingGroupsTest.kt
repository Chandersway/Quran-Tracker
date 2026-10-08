package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class OnboardingGroupsTest {
    @Test fun fictitiousLeaderboardIsOrderedAndLocalized() {
        assertEquals(listOf(240,180,120), onboardingGroupPoints.map { it.second })
        for(language in listOf("nl","en","ar")) {
            val text = AppText.strings(language)
            for(key in listOf("name","feed","message","pointsHelp","create","join","createInfo","joinInfo")) {
                assertFalse(text.t("onboarding.groups.$key").startsWith("onboarding."))
            }
            onboardingGroupPoints.forEach { (name, points) ->
                assertFalse(text.t("onboarding.groups.$name").startsWith("onboarding."))
                assertFalse(text.t("onboarding.groups.points", points).contains("%"))
            }
        }
    }
}
