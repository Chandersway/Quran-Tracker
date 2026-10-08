package com.Ameender.qurantracker.data

/** Stable IDs are persisted, so adding or rearranging previews does not corrupt progress. */
enum class OnboardingStep(val id: String) {
    READING("reading"), HIFZ("hifz"), POMODORO("pomodoro"),
    PLANNING("planning"), STATISTICS("statistics"), GROUPS("groups");

    val titleKey get() = "onboarding.$id.title"
    val descriptionKey get() = "onboarding.$id.description"
    val previous get() = entries.getOrNull(ordinal - 1)
    val next get() = entries.getOrNull(ordinal + 1)

    companion object {
        fun fromId(id: String?) = entries.firstOrNull { it.id == id } ?: READING
    }
}
