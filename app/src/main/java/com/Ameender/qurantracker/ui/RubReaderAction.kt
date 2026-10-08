package com.Ameender.qurantracker.ui

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

internal data class RubReaderTarget(val hizb: Int, val quarter: Int, val surah: Int, val ayah: Int, val page: Int,
    val printedAyah: Int = ayah)
internal data class RubReaderAvailability(val target: RubReaderTarget? = null, val messageKey: String? = null)

/** Canonical ayah is for reader routing; printedAyah is the edition's visible number. */
internal fun loadWarshRubTarget(context: Context, hizb: Int, quarter: Int): RubReaderTarget {
    require(hizb in 1..60 && quarter in 1..4)
    val root = context.assets.open("warsh_rub_starts.json").bufferedReader().use { JSONObject(it.readText()) }
    require(root.getInt("schemaVersion") == 1 && root.getString("edition") == "warsh_maknoon")
    require(root.getString("status") == "printed_boundaries_validated")
    val starts = root.getJSONArray("starts")
    require(starts.length() == 240)
    val id = (hizb - 1) * 4 + quarter
    val item = starts.getJSONObject(id - 1)
    require(item.getInt("id") == id && item.getInt("hizb") == hizb && item.getInt("quarter") == quarter)
    val target = RubReaderTarget(hizb, quarter, item.getInt("surah"), item.getInt("ayah"),
        item.getInt("page"), item.getInt("printedAyah"))
    require(target.page in 1..604 && target.surah in 1..114)
    require(WarshMaknoonPages.load(context, target.page).positions.any {
        it.surahId == target.surah && it.ayahNumber == target.printedAyah
    })
    require(target.ayah in WarshAyahReferences.hafsAyahs(context, target.surah, target.printedAyah))
    return target
}

/** Read-only navigation lookup. Quarantined Warsh data must never be used as a fallback. */
internal fun loadRubReaderTarget(context: Context, mode: String, hizb: Int, quarter: Int): RubReaderAvailability {
    require(hizb in 1..60 && quarter in 1..4)
    if (mode == "warsh_maknoon") {
        val target = loadWarshRubTarget(context, hizb, quarter)
        val file = downloadedMushafPageFile(context, mode, target.page)
        return if (downloadedMushafPageCount(context, mode) < 604 || !file.exists() || file.length() == 0L)
            RubReaderAvailability(messageKey = "rub.open.download")
        else RubReaderAvailability(target)
    }
    if (mode.startsWith("warsh")) return RubReaderAvailability(messageKey = "rub.open.warshPending")
    if (mode !in setOf("hafs", "hafs_maknoon")) return RubReaderAvailability(messageKey = "rub.open.unsupported")
    val root = context.assets.open("rub_starts.json").bufferedReader().use { JSONObject(it.readText()) }
    require(root.getInt("schemaVersion") == 1)
    require(root.getJSONObject("editionStatus").getJSONObject("hafs").getString("status") == "structurally_validated")
    val starts = root.getJSONObject("editions").getJSONArray("hafs")
    require(starts.length() == 240)
    val id = (hizb - 1) * 4 + quarter
    val item = starts.getJSONObject(id - 1)
    require(item.getInt("id") == id && item.getInt("hizb") == hizb && item.getInt("quarter") == quarter)
    val target = RubReaderTarget(hizb, quarter, item.getInt("surah"), item.getInt("ayah"), item.getInt("page"))
    require(target.page in 1..604 && target.surah in 1..114)
    if (mode == "hafs_maknoon") {
        val file = downloadedMushafPageFile(context, mode, target.page)
        if (downloadedMushafPageCount(context, mode) < 604 || !file.exists() || file.length() == 0L)
            return RubReaderAvailability(messageKey = "rub.open.download")
    } else {
        val resource = context.resources.getIdentifier("hafs_madina_page_${target.page.toString().padStart(3, '0')}", "drawable", context.packageName)
        if (resource == 0) return RubReaderAvailability(messageKey = "rub.open.download")
    }
    require(loadHafsMadinaPagePositions(context, target.page).any { it.surahId == target.surah && it.ayahNumber == target.ayah })
    return RubReaderAvailability(target)
}

@Composable
internal fun RubReaderAction(hizb: Int, quarter: Int, mushafMode: String, text: AppStrings,
    onOpen: (RubReaderTarget) -> Unit) {
    val context = LocalContext.current
    val availability by produceState<RubReaderAvailability?>(null, hizb, quarter, mushafMode) {
        value = withContext(Dispatchers.IO) {
            try { loadRubReaderTarget(context, mushafMode, hizb, quarter) }
            catch (_: Exception) { RubReaderAvailability(messageKey = "rub.open.error") }
        }
    }
    RubReaderActionContent(availability, text, onOpen)
}

@Composable
internal fun RubReaderActionContent(availability: RubReaderAvailability?, text: AppStrings,
    onOpen: (RubReaderTarget) -> Unit) {
    val target = availability?.target
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        OutlinedButton(onClick = { target?.let(onOpen) }, enabled = target != null,
            modifier = Modifier.fillMaxWidth().testTag("rub_open_reader")) {
            Text(text.t("rub.open.action"))
        }
        Text(if (target != null) text.t("rub.open.destination", target.surah, target.printedAyah, target.page)
            else text.t(availability?.messageKey ?: "rub.open.loading"),
            style = MaterialTheme.typography.bodySmall, color = MutedGold)
    }
}
