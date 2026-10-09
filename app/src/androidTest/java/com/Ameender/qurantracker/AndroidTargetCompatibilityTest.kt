package com.Ameender.qurantracker

import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test

class AndroidTargetCompatibilityTest {
    @Test fun packagedAppTargets36WithoutDroppingOlderDevicesOrChangingIdentity() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        assertEquals(36, context.applicationInfo.targetSdkVersion)
        assertEquals(26, context.applicationInfo.minSdkVersion)
        assertEquals("com.Ameender.qurantracker", context.packageName)
        assertEquals("Wirdna – Quran & Hifz", context.getString(R.string.app_name))
    }
}
