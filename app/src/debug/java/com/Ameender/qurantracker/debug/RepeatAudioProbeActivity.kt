package com.Ameender.qurantracker.debug

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.ui.*
import kotlinx.coroutines.delay
import java.util.Locale

/** Disposable part-1 harness. Reuses the real player, never writes user progress. */
class RepeatAudioProbeActivity : ComponentActivity() {
    private var queue = emptyList<AudioTrack>()
    private var index by mutableIntStateOf(0)
    private var page by mutableIntStateOf(2)
    private var warsh by mutableStateOf(true)
    private var description by mutableStateOf("")
    private lateinit var player: GlobalAudioPlayer

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        player = GlobalAudioPlayer(resolveNextTrack = {
            Log.i(TAG, "Finished ${index + 1}/${queue.size}")
            queue.getOrNull(index + 1)?.also { index++ }
        })
        warsh = intent.getStringExtra("edition") != "hafs"
        page = intent.getIntExtra("page", 2).coerceIn(1, 604)
        setContent {
            QuranTrackerTheme {
                Surface(Modifier.fillMaxSize()) {
                    Column(Modifier.safeDrawingPadding().padding(20.dp)
                        .verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Audio-test · deel 1", style = MaterialTheme.typography.headlineSmall)
                        Text("Alleen een technische proef. Geen leespunten of wijzigingen aan je voortgang.")
                        Text("Warsh: Ibrahim Al-Dosari · Hafs: Mishary Alafasy. Bron: EveryAyah.")
                        Text("De inhoud en nummering van de Warsh-audio moeten nog beluisterd en bevestigd worden.",
                            color = MaterialTheme.colorScheme.error)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(selected = warsh, onClick = { reset(); warsh = true }, label = { Text("Warsh") })
                            FilterChip(selected = !warsh, onClick = { reset(); warsh = false }, label = { Text("Hafs") })
                        }
                        Text("Pagina $page · 604-pagina-editie")
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf(1, 2, 106, 300).forEach { choice ->
                                OutlinedButton(onClick = { reset(); page = choice }) { Text("$choice") }
                            }
                        }
                        Button(onClick = { startProbe() }) { Text("Speel deze pagina 2×") }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(enabled = player.currentTrack != null,
                                onClick = { player.togglePlayPause() }) {
                                Text(if (player.isPlaying) "Pauze" else "Hervatten / opnieuw proberen")
                            }
                        }
                        OutlinedButton(onClick = { reset() }) { Text("Stop") }
                        Text(description)
                        Text("Status: ${player.playbackState}")
                        player.currentTrack?.let { track ->
                            val perRound = (queue.size / 2).coerceAtLeast(1)
                            Text("Ronde ${index / perRound + 1}/2 · bestand ${index % perRound + 1}/$perRound")
                            Text("Audioreferentie ${track.surahId}:${track.ayahNumber}")
                            Text("${player.positionMs / 1000} / ${player.durationMs / 1000} sec")
                        }
                        Text("Volledige ayahbestanden: bij overlappende paginagrenzen kan extra tekst klinken. Geen exacte knip op woorden.")
                        TextButton(onClick = { finish() }) { Text("Sluit test") }
                    }
                }
                LaunchedEffect(player.playbackState, index) {
                    Log.i(TAG, "${if (warsh) "warsh" else "hafs"} page=$page item=${index + 1}/${queue.size} state=${player.playbackState}")
                    if (player.playbackState == AudioPlaybackState.Loading ||
                        player.playbackState == AudioPlaybackState.Buffering) {
                        delay(30_000)
                        player.stop()
                        description = "Laden duurt te lang. Controleer internet en start de proef opnieuw."
                        Log.w(TAG, "Probe timed out; playback NOT verified")
                    }
                }
                LaunchedEffect(Unit) {
                    while (true) { player.updatePosition(); delay(500) }
                }
            }
        }
        if (intent.getBooleanExtra("autoplay", false)) startProbe()
    }

    private fun startProbe() {
        reset()
        runCatching {
            val printed = if (warsh) WarshMaknoonPages.load(this, page).positions
                else loadHafsMadinaPagePositions(this, page)
            val refs = printed.flatMap { position ->
                val ayahs = if (warsh) WarshAyahReferences.hafsAyahs(this, position.surahId, position.ayahNumber)
                    else listOf(position.ayahNumber)
                ayahs.map { position.surahId to it }
            }.distinct().sortedWith(compareBy({ it.first }, { it.second }))
            require(refs.isNotEmpty()) { "Geen paginareferenties beschikbaar" }
            val directory = if (warsh) "warsh/warsh_ibrahim_aldosary_128kbps" else "Alafasy_128kbps"
            val tracks = refs.map { (surah, ayah) ->
                AudioTrack(surahId = surah, surahName = "Testpagina $page", ayahNumber = ayah,
                    reciterName = if (warsh) "Ibrahim Al-Dosari (Warsh-test)" else "Mishary Alafasy (Hafs)",
                    audioUrl = "https://everyayah.com/data/$directory/" + String.format(Locale.ROOT, "%03d%03d.mp3", surah, ayah))
            }
            queue = tracks + tracks
            description = "Gedrukte ayat: ${printed.map { it.surahId to it.ayahNumber }.distinct().size}. " +
                "Audiobestanden per ronde: ${tracks.size}."
            player.play(queue.first())
        }.onFailure { description = "Test kon niet starten: ${it.message}" }
    }

    private fun reset() { player.stop(); queue = emptyList(); index = 0; description = "" }

    override fun onStop() {
        player.pause() // This diagnostic intentionally has no background playback.
        super.onStop()
    }

    override fun onDestroy() { player.release(); super.onDestroy() }

    companion object { private const val TAG = "RepeatAudioProbe" }
}
