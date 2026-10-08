package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class OnboardingStatisticsTest {
    @Test fun fixedExamplesHaveExpectedCounts() {
        assertEquals(listOf("hizb", "juz", "surah"), onboardingReadCounts.map { it.id })
        assertEquals(listOf(5, 2, 3), onboardingReadCounts.map { it.count })
    }
    @Test fun copyAndNamesReuseExistingTranslations() {
        for(language in listOf("nl", "en", "ar")) {
            val text = AppText.strings(language)
            for (item in onboardingReadCounts) {
                assertFalse(text.t(item.nameKey).startsWith("onboarding."))
                assertFalse(text.t("onboarding.reading.count", item.count).contains("%"))
            }
            for(key in listOf("activity", "repetitions", "repeatHelp")) {
                assertFalse(text.t("onboarding.statistics.$key").startsWith("onboarding."))
            }
        }
        assertEquals("5× gelezen", AppText.strings("nl").t("onboarding.reading.count", 5))
        assertEquals("الفاتحة", AppText.strings("ar").t(onboardingReadCounts.last().nameKey))
    }
}
