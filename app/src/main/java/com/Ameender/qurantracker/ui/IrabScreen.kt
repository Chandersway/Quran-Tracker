package com.Ameender.qurantracker.ui

import android.text.Html
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.CancellationException

@Composable
internal fun IrabScreen(text: AppStrings, initialSurah: Int = 1, initialAyah: Int = 1,
    autoLoad: Boolean = false, warshAyah: Int? = null,
    asbab: Boolean = false,
    load: suspend (Int, Int, Int) -> IrabResult = IrabRepository::load,
    loadAvailability: suspend () -> AsbabAvailability = AsbabIndex::load,
    onClose: () -> Unit) {
    val context = LocalContext.current
    val linked = remember(initialSurah, warshAyah) {
        if (warshAyah == null) emptyList() else runCatching {
            WarshAyahReferences.hafsAyahs(context, initialSurah, warshAyah)
        }.getOrDefault(emptyList())
    }
    var surah by rememberSaveable { mutableIntStateOf(initialSurah) }
    var ayah by rememberSaveable { mutableStateOf((linked.firstOrNull() ?: initialAyah).toString()) }
    val initialBook = if (asbab) 2919 else 316
    var book by rememberSaveable { mutableIntStateOf(initialBook) }
    var chapterMenu by remember { mutableStateOf(false) }
    var ayahMenu by remember { mutableStateOf(false) }
    var availability by remember { mutableStateOf<AsbabAvailability?>(null) }
    var indexError by remember { mutableStateOf(false) }
    var indexRetry by remember { mutableIntStateOf(0) }
    var request by remember { mutableStateOf<Triple<Int, Int, Int>?>(
        if (!asbab && autoLoad && (warshAyah == null || linked.isNotEmpty())) Triple(initialSurah, linked.firstOrNull() ?: initialAyah, initialBook) else null) }
    var retry by remember { mutableIntStateOf(0) }
    var loading by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf<IrabResult?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val chapter = ALL_SURAHS.first { it.id == surah }
    val fixedReferences = if (warshAyah != null) linked else listOf(initialAyah)
    val books = (if (asbab) listOf(2919 to "الواحدي", 460 to "المحرر — المزيني") else listOf(316 to "الدعاس", 309 to "العكبري"))
        .filter { (id, _) -> !asbab || availability?.let { index ->
            if (autoLoad) fixedReferences.any { index.has(id, initialSurah, it) }
            else index.entries[id]?.isNotEmpty() == true
        } == true }
    val availableAyahs = availability?.ayahs(book, surah).orEmpty().filter { !autoLoad || it in fixedReferences }
    val valid = ayah.toIntOrNull()?.let { it in 1..chapter.ayahs && (warshAyah == null || it in linked) && (!asbab || it in availableAyahs) } == true
    LaunchedEffect(asbab, indexRetry) {
        if (!asbab) return@LaunchedEffect
        indexError = false
        try { availability = loadAvailability() }
        catch (cancelled: CancellationException) { throw cancelled }
        catch (_: Exception) { indexError = true }
    }
    LaunchedEffect(availability, book) {
        if (!asbab || availability == null) return@LaunchedEffect
        if (books.none { it.first == book }) {
            books.firstOrNull()?.let { book = it.first }
            return@LaunchedEffect
        }
        if (!autoLoad && availability?.ayahs(book, surah).isNullOrEmpty()) {
            surah = availability!!.entries.getValue(book).keys.min()
        }
        val options = availability!!.ayahs(book, surah).filter { !autoLoad || it in fixedReferences }
        if (ayah.toIntOrNull() !in options) ayah = options.firstOrNull()?.toString().orEmpty()
        if (autoLoad && options.isNotEmpty()) request = Triple(surah, ayah.toInt(), book)
    }
    val uriHandler = LocalUriHandler.current
    LaunchedEffect(request, retry) {
        val chosen = request ?: return@LaunchedEffect
        loading = true
        error = null
        result = null
        try {
            result = load(chosen.first, chosen.second, chosen.third)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            error = if (failure is IrabRateLimit) "irab.rateLimit" else "irab.error"
        } finally { loading = false }
    }
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(Modifier.safeDrawingPadding().padding(20.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text.t(if (asbab) "asbab.title" else "irab.title"), style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                    TextButton(onClick = onClose) { Text(text.t("irab.close")) }
                }
                Text(text.t(if (asbab) "asbab.notice" else "irab.notice"), style = MaterialTheme.typography.bodyMedium)
                Text(text.t("irab.source"), style = MaterialTheme.typography.labelLarge)
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    books.forEach { (id, label) ->
                        FilterChip(selected = book == id, enabled = !loading, onClick = {
                            book = id; request = null; result = null; error = null
                        }, label = { Text(label) })
                    }
                }
                if (asbab && availability == null) {
                    if (indexError) {
                        Text(text.t("irab.error"), color = MaterialTheme.colorScheme.error)
                        Button(onClick = { indexRetry++ }) { Text(text.t("irab.load")) }
                    } else { CircularProgressIndicator(); Text(text.t("irab.loading")) }
                }
                if (asbab && availability != null && books.isEmpty()) Text(text.t("asbab.empty"))
                if (warshAyah != null) {
                    Text(text.t(if (asbab) "asbab.warshMapping" else "irab.warshMapping", "$initialSurah:$warshAyah",
                        linked.joinToString(", ") { "$initialSurah:$it" }), style = MaterialTheme.typography.titleMedium)
                    if (linked.isEmpty()) Text(text.t("irab.mappingMissing"), color = MaterialTheme.colorScheme.error)
                    Row(Modifier.horizontalScroll(androidx.compose.foundation.rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        linked.filter { !asbab || it in availableAyahs }.forEach { reference ->
                            FilterChip(selected = ayah == reference.toString(), enabled = !loading,
                                onClick = { ayah = reference.toString(); request = Triple(initialSurah, reference, book) },
                                label = { Text("Hafs $initialSurah:$reference") })
                        }
                    }
                }
                Box {
                    OutlinedButton(onClick = { chapterMenu = true }, enabled = !loading && warshAyah == null && (!asbab || (!autoLoad && books.isNotEmpty()))) {
                        Text("$surah · ${chapter.name} · ${chapter.arabic}")
                    }
                    DropdownMenu(expanded = chapterMenu, onDismissRequest = { chapterMenu = false }, modifier = Modifier.heightIn(max = 360.dp)) {
                        ALL_SURAHS.filter { !asbab || availability?.ayahs(book, it.id)?.isNotEmpty() == true }.forEach { option ->
                            DropdownMenuItem(text = { Text("${option.id} · ${option.name} · ${option.arabic}") }, onClick = {
                                surah = option.id; ayah = if (asbab) availability!!.ayahs(book, option.id).first().toString() else "1"; chapterMenu = false; request = null; result = null; error = null
                            })
                        }
                    }
                }
                if (asbab) Box {
                    OutlinedButton(onClick = { ayahMenu = true }, enabled = !loading && availableAyahs.isNotEmpty()) {
                        Text(text.t("irab.ayah", chapter.ayahs) + ": " + ayah)
                    }
                    DropdownMenu(expanded = ayahMenu, onDismissRequest = { ayahMenu = false }, modifier = Modifier.heightIn(max = 360.dp)) {
                        availableAyahs.forEach { number ->
                            DropdownMenuItem(text = { Text("$surah:$number") }, onClick = {
                                ayah = number.toString(); ayahMenu = false; request = null; result = null; error = null
                            })
                        }
                    }
                } else OutlinedTextField(value = ayah, onValueChange = {
                    ayah = it.filter(Char::isDigit).take(3); request = null; result = null; error = null
                }, enabled = !loading && warshAyah == null, singleLine = true, label = { Text(text.t("irab.ayah", chapter.ayahs)) },
                    isError = !valid, modifier = Modifier.fillMaxWidth())
                Button(enabled = valid && !loading, onClick = {
                    request = Triple(surah, ayah.toInt(), book); retry++
                }, modifier = Modifier.fillMaxWidth()) { Text(text.t("irab.load")) }
                if (loading) { CircularProgressIndicator(); Text(text.t("irab.loading")) }
                error?.let { Text(text.t(it), color = MaterialTheme.colorScheme.error) }
                result?.let { content ->
                    if (content.fragments.isEmpty()) Text(text.t(if (asbab) "asbab.empty" else "irab.empty"))
                    else {
                        Text(text.t("irab.excerpt"), style = MaterialTheme.typography.bodyMedium)
                        Text("${content.book}\n${content.author}", style = MaterialTheme.typography.titleMedium)
                        content.fragments.forEach { fragment ->
                            HorizontalDivider()
                            Text(text.t("irab.reference", fragment.volume, fragment.page), style = MaterialTheme.typography.labelMedium)
                            // Plain text only: no WebView, scripts, images, links or remote resources.
                            val plain = remember(fragment.html) { Html.fromHtml(fragment.html, Html.FROM_HTML_MODE_LEGACY).toString() }
                            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                                SelectionContainer { Text(plain, modifier = Modifier.fillMaxWidth(),
                                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 22.sp, lineHeight = 36.sp, textDirection = TextDirection.Rtl)) }
                            }
                        }
                    }
                }
                TextButton(onClick = { uriHandler.openUri("https://quranpedia.net") }) { Text(text.t("irab.credit")) }
            }
        }
    }
}
