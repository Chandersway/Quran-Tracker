package com.Ameender.qurantracker.ui

import android.content.Context
import android.content.res.Configuration
import android.view.ContextThemeWrapper
import java.util.Locale

/** Override resources only: retain the Activity's WindowManager and window token. */
internal fun localizedDialogContext(context: Context, language: String): Context =
    ContextThemeWrapper(context, 0).apply {
        applyOverrideConfiguration(Configuration().apply {
            setLocale(Locale.forLanguageTag(language))
        })
    }
