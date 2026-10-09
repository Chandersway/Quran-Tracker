package com.Ameender.qurantracker.ui

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import kotlinx.coroutines.delay

class IrabScreenTest {
    private fun fixtureIndex() = AsbabAvailability(mapOf(
        2919 to mapOf(2 to listOf(1,2,115,256), 114 to listOf(6)),
        460 to mapOf(2 to listOf(115,256))
    ))
    @Test fun browserAyahMenuOnlyOffersIndexedAyahs() {
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(text,asbab=true,loadAvailability={fixtureIndex()},load={_,_,_->excerpt()},onClose={})
        } }
        compose.onNodeWithText(text.t("irab.ayah",286) + ": 1").performScrollTo().performClick()
        compose.onNodeWithText("2:115").assertExists()
        compose.onNodeWithText("2:3").assertDoesNotExist()
        compose.onNodeWithText("2:115").performScrollTo().performClick()
        compose.onNodeWithText(text.t("irab.ayah",286) + ": 115").assertExists()
    }
    @Test fun linkedVerseOnlyOffersItsAvailableBook() {
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(text,2,1,true,asbab=true,loadAvailability={fixtureIndex()},load={_,_,_->excerpt()},onClose={})
        } }
        compose.onNodeWithText("الواحدي").assertExists()
        compose.onNodeWithText("المحرر — المزيني").assertDoesNotExist()
    }
    @Test fun unavailableVerseOffersNoBooksAndMakesNoContentRequest() {
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(text,2,3,true,asbab=true,loadAvailability={fixtureIndex()},
                load={_,_,_-> error("Must not request unavailable verse")},onClose={})
        } }
        compose.onNodeWithText("الواحدي").assertDoesNotExist()
        compose.onNodeWithText("المحرر — المزيني").assertDoesNotExist()
        compose.onNodeWithText(text.t("irab.load")).performScrollTo().assertIsNotEnabled()
    }
    @Test fun asbabExplicitBookSwitchPreservesAyahAndClearsOldText() {
        var selected: Triple<Int,Int,Int>? = null
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(text,2,115,true,asbab=true,loadAvailability={fixtureIndex()},load={s,a,b ->
                selected=Triple(s,a,b)
                IrabResult("Book $b","Author",listOf(IrabFragment("شرح","1","209")))
            },onClose={})
        } }
        compose.onNodeWithText("Book 2919\nAuthor").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("المحرر — المزيني").performScrollTo().performClick()
        compose.onNodeWithText("Book 2919\nAuthor").assertDoesNotExist()
        compose.onNodeWithText(text.t("irab.load")).performScrollTo().performClick()
        compose.onNodeWithText("Book 460\nAuthor").performScrollTo().assertIsDisplayed()
        compose.runOnIdle { assertEquals(Triple(2,115,460),selected) }
    }
    @Test fun asbabNetworkFailureShowsNoRawDetailsAndCanRetry() {
        var attempts = 0
        val nl = AppText.strings("nl")
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(nl,2,256,true,asbab=true,loadAvailability={fixtureIndex()},load={_,_,_->
                attempts++
                if (attempts == 1) throw java.io.IOException("private server detail")
                excerpt()
            },onClose={})
        } }
        compose.onNodeWithText(nl.t("irab.error")).performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("private server detail").assertDoesNotExist()
        compose.onNodeWithText(nl.t("irab.load")).performScrollTo().performClick()
        compose.onNodeWithText("Test book\nTest author").performScrollTo().assertIsDisplayed()
        compose.runOnIdle { assertEquals(2,attempts) }
    }
    @Test fun asbabArabicLargeTextDarkSourceAndDisclaimerReachable() {
        val ar = AppText.strings("ar")
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density,2f),
                LocalLayoutDirection provides LayoutDirection.Rtl) {
                QuranTrackerTheme("dark") { IrabScreen(ar,2,256,true,asbab=true,loadAvailability={fixtureIndex()},
                    load={_,_,_->excerpt()},onClose={}) }
            }
        }
        compose.onNodeWithText(ar.t("asbab.notice")).performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("Test book\nTest author").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText(ar.t("irab.close")).performScrollTo().assertIsDisplayed()
    }
    @Test fun ayahToolbarAsbabActionIsReachable() {
        var opened = false
        compose.setContent { QuranTrackerTheme("light") {
            AyahSelectionToolbar(ReaderAyahAction(2,"البقرة",256,"",null,false),
                irabLabel="I'rab",asbabLabel="Asbab",onAsbab={opened=true},
                onCopy={},onBookmark={},onShare={},onNotes={},onWords={},onRepeat={},onPlay={})
        } }
        compose.onNodeWithText("Asbab").performScrollTo().performClick()
        compose.runOnIdle { assertTrue(opened) }
    }
    @Test fun asbabWarshUsesEachLinkedReferenceAndWahidi() {
        var selected: Triple<Int,Int,Int>? = null
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(AppText.strings("en"),2,1,true,warshAyah=1,asbab=true,loadAvailability={fixtureIndex()},
                load={s,a,b -> selected=Triple(s,a,b); excerpt()},onClose={})
        } }
        compose.onNodeWithText("Test book\nTest author").performScrollTo().assertIsDisplayed()
        compose.runOnIdle { assertEquals(Triple(2,1,2919),selected) }
        compose.onNodeWithText("Hafs 2:2").performScrollTo().performClick()
        compose.runOnIdle { assertEquals(Triple(2,2,2919),selected) }
        compose.onNodeWithText(AppText.strings("en").t("asbab.warshMapping","2:1","2:1, 2:2"))
            .performScrollTo().assertIsDisplayed()
    }
    @Test fun asbabUsesWahidiAndShowsHonestEmptyState() {
        var requestedBook = 0
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(AppText.strings("nl"),114,6,true,asbab=true,loadAvailability={fixtureIndex()},
                load={_,_,id -> requestedBook=id; IrabResult("أسباب نزول القرآن - الواحدي","",emptyList()) },onClose={})
        } }
        compose.onNodeWithText(AppText.strings("nl").t("asbab.empty")).performScrollTo().assertIsDisplayed()
        compose.runOnIdle { assertEquals(2919,requestedBook) }
        compose.onNodeWithText("الواحدي").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("الدعاس").assertDoesNotExist()
    }
    @get:Rule val compose = createComposeRule()
    private val text = AppText.strings("en")
    private fun excerpt() = IrabResult("Test book", "Test author", listOf(IrabFragment("<p>شرح الآية</p>", "1", "108")))
    @Test fun opensExactAyahAndCloses() {
        var chosen: Pair<Int,Int>? = null
        var closed = false
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(text, 2, 255, true, load = { s,a,_ -> chosen = s to a; excerpt() }, onClose = { closed = true })
        } }
        compose.onNodeWithText("Test book\nTest author").performScrollTo().assertIsDisplayed()
        compose.runOnIdle { assertEquals(2 to 255, chosen) }
        compose.onNodeWithText(text.t("irab.close")).performScrollTo().performClick()
        compose.runOnIdle { assertTrue(closed) }
    }
    @Test fun missingBookRequiresExplicitAlternative() {
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(text,112,1,true,load = { _,_,book -> if(book == 316) IrabResult("", "", emptyList()) else excerpt() },onClose = {})
        } }
        compose.onNodeWithText(text.t("irab.empty")).performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("العكبري").performScrollTo().performClick()
        compose.onNodeWithText(text.t("irab.load")).performScrollTo().performClick()
        compose.onNodeWithText("Test book\nTest author").performScrollTo().assertIsDisplayed()
    }
    @Test fun rateLimitCanRetryAndInvalidInputCannotLoad() {
        var attempts=0
        compose.setContent { QuranTrackerTheme("dark") {
            IrabScreen(text,load = { _,_,_ -> attempts++; if(attempts==1) throw IrabRateLimit(); excerpt() },onClose = {})
        } }
        compose.onNodeWithText(text.t("irab.load")).performScrollTo().performClick()
        compose.onNodeWithText(text.t("irab.rateLimit")).performScrollTo().assertIsDisplayed()
        compose.onNodeWithText(text.t("irab.load")).performScrollTo().performClick()
        compose.onNodeWithText("Test book\nTest author").performScrollTo().assertIsDisplayed()
        compose.onNode(hasSetTextAction()).performScrollTo().performTextReplacement("0")
        compose.onNodeWithText(text.t("irab.load")).assertIsNotEnabled()
    }
    @Test fun warshMultipleReferencesArabicLargeTextDark() {
        val ar=AppText.strings("ar")
        var chosen=0
        compose.setContent {
            val density=LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density,2f), LocalLayoutDirection provides LayoutDirection.Rtl) {
                QuranTrackerTheme("dark") { IrabScreen(ar,2,1,true,warshAyah=1,
                    load={_,a,_->chosen=a;excerpt()},onClose={}) }
            }
        }
        compose.onNodeWithText("Hafs 2:2").performScrollTo().performClick()
        compose.runOnIdle { assertEquals(2,chosen) }
        compose.onNodeWithText(ar.t("irab.close")).performScrollTo().assertIsDisplayed()
    }
    @Test fun slowRequestDisablesDuplicateSubmission() {
        compose.setContent { QuranTrackerTheme("light") {
            IrabScreen(text,autoLoad=true,load={_,_,_->delay(60000);excerpt()},onClose={})
        } }
        compose.onNodeWithText(text.t("irab.load")).performScrollTo().assertIsNotEnabled()
        compose.onNodeWithText(text.t("irab.close")).performScrollTo().assertIsEnabled()
    }
}
