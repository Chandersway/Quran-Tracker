package com.Ameender.qurantracker.ui

import com.Ameender.qurantracker.data.OnboardingStep
import org.junit.Assert.*
import org.junit.Test

class OnboardingTextTest {
    @Test fun allThreeLanguagesContainAllStepAndControlTranslations() {
        val keys = OnboardingStep.entries.flatMap { listOf(it.titleKey, it.descriptionKey) } +
            listOf("skip", "next", "previous", "start", "placeholder").map { "onboarding.$it" } +
            listOf("demo", "register", "quickCheck", "surah.name", "surah.passage", "hizb.name",
                "hizb.passage", "rub.name", "rub.passage", "juz.name", "juz.passage").map { "onboarding.reading.$it" }
        for (language in listOf("nl", "en", "ar")) {
            val text = AppText.strings(language)
            for (key in listOf("unrated", "hold", "edit", "zero")) {
                assertFalse(text.t("onboarding.hifz.$key").startsWith("onboarding."))
            }
            assertFalse(text.t("onboarding.hifz.score", 75).contains("%"))
            keys.forEach {
                assertTrue(text.t(it).isNotBlank())
                assertFalse(text.t(it).startsWith("onboarding."))
            }
            assertFalse(text.t("onboarding.progress", 2, 6).contains("%"))
        }
    }
}
