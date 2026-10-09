package com.Ameender.qurantracker.ui

import android.content.Context
import android.graphics.Bitmap
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.Ameender.qurantracker.data.QuranDatabaseHelper
import java.io.File
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class WarshMaknoonGeometryTest {
    @get:Rule val compose = createComposeRule()
    private val context: Context get() = ApplicationProvider.getApplicationContext()

    @Test fun allPagesUseValidNonOverlappingWarshVerses() {
        val verses = mutableSetOf<Pair<Int, Int>>()
        for (page in 1..604) {
            val geometry = WarshMaknoonPages.load(context, page)
            assertTrue(geometry.width > 0 && geometry.height > 0)
            assertTrue(geometry.positions.isNotEmpty())
            for (position in geometry.positions) {
                assertTrue("page $page: $position", position.left >= 0 && position.top >= 0 &&
                    position.width > 0 && position.height > 0 &&
                    position.left + position.width <= 1.00001f && position.top + position.height <= 1.00001f)
                verses += position.surahId to position.ayahNumber
            }
            geometry.positions.forEachIndexed { index, a ->
                geometry.positions.drop(index + 1).forEach { b ->
                    val overlapX = minOf(a.left + a.width, b.left + b.width) - maxOf(a.left, b.left)
                    val overlapY = minOf(a.top + a.height, b.top + b.height) - maxOf(a.top, b.top)
                    assertFalse("page $page: overlapping ayah targets", overlapX > .00001f && overlapY > .00001f)
                }
            }
        }
        assertEquals(6214, verses.size)
        assertEquals(5, WarshMaknoonPages.load(context, 3).positions.first().ayahNumber)
        assertEquals(setOf(112, 113, 114), WarshMaknoonPages.load(context, 604).positions.map { it.surahId }.toSet())
        assertEquals(604, WarshMaknoonPages.findAyah(context, 114, 6, listOf(604))?.page)
        assertEquals(listOf(1, 2), WarshAyahReferences.hafsAyahs(context, 2, 1))
        assertEquals(listOf(6), WarshAyahReferences.hafsAyahs(context, 2, 5))
        assertEquals(listOf(202), WarshAyahReferences.hafsAyahs(context, 2, 200))
        assertEquals(listOf(286), WarshAyahReferences.hafsAyahs(context, 2, 285))
        assertEquals(2, WarshMaknoonPages.findAyah(context, 2, 5, listOf(2, 3))?.page)
        assertEquals(3, WarshMaknoonPages.findAyah(context, 2, 6, listOf(2, 3))?.page)
    }

    @Test fun physicalPageTargetsStayAlignedAtDifferentSizesAndInRtl() {
        assumeTrue(downloadedMushafPageFile(context, "warsh_maknoon", 3).exists())
        val page = mutableStateOf(3)
        val width = mutableStateOf(240)
        val direction = mutableStateOf(LayoutDirection.Ltr)
        var selected: Pair<Int, Int>? = null
        val helper = QuranDatabaseHelper(context)
        compose.setContent {
            MaterialTheme {
                CompositionLocalProvider(LocalLayoutDirection provides direction.value) {
                    MaknoonWarshMushafPage(
                        pageNumber = page.value,
                        pageFile = downloadedMushafPageFile(context, "warsh_maknoon", page.value),
                        dbHelper = helper,
                        currentChapterId = 1,
                        ayahs = emptyList(),
                        bookmarkedAyahs = emptySet(),
                        selectedAyahKey = null,
                        onSelectAyah = { surah, ayah, _, _, _, _ -> selected = surah to ayah },
                        modifier = Modifier.width(width.value.dp).testTag("warsh-page")
                    )
                }
            }
        }
        for (p in listOf(2, 3, 604)) for (size in listOf(240, 320)) for (layout in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            compose.runOnIdle { page.value = p; width.value = size; direction.value = layout }
            compose.waitUntil(15000) {
                compose.onAllNodesWithContentDescription("Warsh Maknoon pagina $p").fetchSemanticsNodes().isNotEmpty()
            }
            val geometry = WarshMaknoonPages.load(context, p)
            for (target in listOf(geometry.positions.first(), geometry.positions.last())) {
                compose.runOnIdle { selected = null }
                compose.onNodeWithTag("warsh-page").performTouchInput {
                    longClick(Offset(
                        ((target.left + target.width / 2) * 1.12f - .06f) * this.width,
                        ((target.top + target.height / 2) * 1.12f - .06f) * this.height
                    ))
                }
                val hafsAyah = WarshAyahReferences.hafsAyahs(context, target.surahId, target.ayahNumber).first()
                compose.runOnIdle { assertEquals("page $p, width $size, $layout", target.surahId to hafsAyah, selected) }
            }
            if (size == 320 && layout == LayoutDirection.Ltr) {
                val folder = context.getExternalFilesDir("warsh-qa")!!.apply { mkdirs() }
                File(folder, "page-$p.png").outputStream().use { stream ->
                    compose.onNodeWithTag("warsh-page").captureToImage().asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, stream)
                }
            }
        }
    }
}
