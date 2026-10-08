package com.Ameender.qurantracker.data

import android.content.Context

enum class AppLanguage(val code: String, val nativeName: String) {
    Dutch("nl", "Nederlands"), English("en", "English"), Arabic("ar", "العربية");

    companion object {
        fun fromCode(code: String?) = entries.firstOrNull { it.code == code } ?: Dutch
    }
}

enum class LanguageEntryStage { LANGUAGE, INTRO_PENDING, EXISTING_USER, COMPLETED }

/** Explicit state takes precedence over settings created during an interrupted first launch. */
fun resolveLanguageEntry(saved: String?, hasExistingData: Boolean): LanguageEntryStage =
    LanguageEntryStage.entries.firstOrNull { it.name == saved }
        ?: if (hasExistingData) LanguageEntryStage.EXISTING_USER else LanguageEntryStage.LANGUAGE

class LanguageEntryStore(context: Context) {
    private val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
    val initialStage: LanguageEntryStage

    init {
        @Suppress("DEPRECATION")
        val install = context.packageManager.getPackageInfo(context.packageName, 0)
        val existing = prefs.all.isNotEmpty() || context.getDatabasePath("quran_database").exists() ||
            install.lastUpdateTime > install.firstInstallTime
        initialStage = resolveLanguageEntry(prefs.getString(STAGE_KEY, null), existing)
        if (prefs.getString(STAGE_KEY, null) != initialStage.name) {
            prefs.edit().putString(STAGE_KEY, initialStage.name).apply()
        }
    }

    fun language() = AppLanguage.fromCode(prefs.getString("app_language", "nl"))

    fun select(language: AppLanguage) {
        prefs.edit().putString("app_language", language.code).apply()
    }

    fun continueToIntro(language: AppLanguage) {
        prefs.edit().putString("app_language", language.code)
            .putString(STAGE_KEY, LanguageEntryStage.INTRO_PENDING.name).apply()
    }

    fun introStep() = OnboardingStep.fromId(prefs.getString(STEP_KEY, null))

    fun saveIntroStep(step: OnboardingStep) {
        prefs.edit().putString(STEP_KEY, step.id).apply()
    }

    fun returnToLanguage() {
        prefs.edit().putString(STAGE_KEY, LanguageEntryStage.LANGUAGE.name).apply()
    }

    /** Called only by Skip or Start; visiting the last page is not completion. */
    fun completeIntro() {
        prefs.edit().putString(STAGE_KEY, LanguageEntryStage.COMPLETED.name)
            .remove(STEP_KEY).apply()
    }

    companion object {
        private const val STAGE_KEY = "onboarding_language_stage_v1"
        private const val STEP_KEY = "onboarding_intro_step_v1"
    }
}
