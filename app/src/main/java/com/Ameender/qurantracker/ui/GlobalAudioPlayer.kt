package com.Ameender.qurantracker.ui

import android.media.MediaPlayer
import android.media.PlaybackParams
import android.os.Handler
import android.os.Looper
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Forward5
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material.icons.filled.Replay5
import androidx.compose.material.icons.filled.ReplayCircleFilled
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlin.math.abs

data class AudioTrack(
    val surahId: Int,
    val surahName: String,
    val surahNameArabic: String = "",
    val ayahNumber: Int?,
    val reciterName: String,
    val audioUrl: String,
    val clipStartMs: Int = 0,
    val clipEndMs: Int? = null
)

enum class AudioPlaybackState {
    Idle,
    Loading,
    Buffering,
    Playing,
    Paused,
    Completed,
    Error
}

enum class AudioErrorType {
    Network,
    Unavailable,
    Unknown
}

class GlobalAudioPlayer(
    initialPlaybackSpeed: Float = 1f,
    initialSkipIntervalSeconds: Int = 10,
    initialRepeatEnabled: Boolean = false,
    initialAutoplayEnabled: Boolean = true,
    private val onPlaybackSpeedChanged: (Float) -> Unit = {},
    private val onSkipIntervalChanged: (Int) -> Unit = {},
    private val onRepeatChanged: (Boolean) -> Unit = {},
    private val onAutoplayChanged: (Boolean) -> Unit = {},
    private val resolveNextTrack: (AudioTrack) -> AudioTrack? = { null }
) {
    private val mediaPlayer = MediaPlayer()
    private val supportedPlaybackSpeeds = setOf(0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f)
    private var playWhenReady = false
    private var selectionTracks = emptyList<AudioTrack>()
    private var selectionIndex = 0
    var selectionTitle by mutableStateOf<String?>(null)
        private set
    var selectionRound by mutableIntStateOf(1)
        private set
    var selectionRounds by mutableIntStateOf(2)
        private set
    var repeatSheetRequested by mutableStateOf(false)
    var playerSheetRequested by mutableStateOf(false)
    var canConfigureSelection by mutableStateOf(false)

    fun playSelection(tracks: List<AudioTrack>, title: String, rounds: Int) {
        require(tracks.isNotEmpty() && rounds in listOf(0, 2, 3, 5))
        stop()
        selectionTracks = tracks.toList()
        selectionTitle = title
        selectionRounds = rounds
        selectionRound = 1
        selectionIndex = 0
        playInternal(selectionTracks.first())
    }

    var isPlaying by mutableStateOf(false)
        private set
    var isPreparing by mutableStateOf(false)
        private set
    var isBuffering by mutableStateOf(false)
        private set
    var isVisible by mutableStateOf(false)
        private set
    var currentTrack by mutableStateOf<AudioTrack?>(null)
        private set
    var positionMs by mutableIntStateOf(0)
        private set
    var durationMs by mutableIntStateOf(0)
        private set
    var bufferedPercent by mutableIntStateOf(0)
        private set
    var playbackSpeed by mutableStateOf(normalizePlaybackSpeed(initialPlaybackSpeed))
        private set
    var skipIntervalSeconds by mutableIntStateOf(normalizeSkipInterval(initialSkipIntervalSeconds))
        private set
    var repeatEnabled by mutableStateOf(initialRepeatEnabled)
        private set
    var autoplayEnabled by mutableStateOf(initialAutoplayEnabled)
        private set
    var playbackState by mutableStateOf(AudioPlaybackState.Idle)
        private set
    var errorType by mutableStateOf<AudioErrorType?>(null)
        private set
    var sleepTimerEndsAtMs by mutableStateOf<Long?>(null)
        private set

    private val clipHandler = Handler(Looper.getMainLooper())
    private val clipWatch = object : Runnable {
        override fun run() {
            val end = currentTrack?.clipEndMs ?: return
            if (isPlaying && !isPreparing && runCatching { mediaPlayer.currentPosition >= end }.getOrDefault(false)) {
                runCatching { mediaPlayer.pause() }
                completeTrack()
            }
            if (currentTrack?.clipEndMs != null && isPlaying) clipHandler.postDelayed(this, 20)
        }
    }

    private fun completeTrack() {
            clipHandler.removeCallbacks(clipWatch)
            if (selectionTracks.isNotEmpty()) {
                val next = nextRepeatStep(selectionIndex, selectionRound, selectionTracks.size, selectionRounds)
                if (next != null) {
                    selectionIndex = next.first
                    selectionRound = next.second
                    playInternal(selectionTracks[selectionIndex])
                    return
                }
            }
            val nextTrack = currentTrack
                ?.takeIf { selectionTracks.isEmpty() && autoplayEnabled && !repeatEnabled }
                ?.let(resolveNextTrack)
            if (nextTrack != null) {
                play(nextTrack, startWhenReady = true)
                return
            }
            isPlaying = false
            isPreparing = false
            isBuffering = false
            positionMs = durationMs.coerceAtLeast(0)
            playbackState = AudioPlaybackState.Completed
    }

    init {
        mediaPlayer.isLooping = repeatEnabled
        mediaPlayer.setOnCompletionListener { completeTrack() }
        mediaPlayer.setOnBufferingUpdateListener { _, percent ->
            bufferedPercent = percent.coerceIn(0, 100)
        }
        mediaPlayer.setOnInfoListener { _, what, _ ->
            when (what) {
                MediaPlayer.MEDIA_INFO_BUFFERING_START -> {
                    isBuffering = true
                    if (isPlaying) playbackState = AudioPlaybackState.Buffering
                }
                MediaPlayer.MEDIA_INFO_BUFFERING_END -> {
                    isBuffering = false
                    playbackState = if (isPlaying) AudioPlaybackState.Playing else AudioPlaybackState.Paused
                }
            }
            false
        }
        mediaPlayer.setOnErrorListener { _, _, extra ->
            isPreparing = false
            isBuffering = false
            isPlaying = false
            playWhenReady = false
            errorType = when (extra) {
                MediaPlayer.MEDIA_ERROR_IO,
                MediaPlayer.MEDIA_ERROR_TIMED_OUT -> AudioErrorType.Network
                MediaPlayer.MEDIA_ERROR_MALFORMED,
                MediaPlayer.MEDIA_ERROR_UNSUPPORTED -> AudioErrorType.Unavailable
                else -> AudioErrorType.Unknown
            }
            playbackState = AudioPlaybackState.Error
            true
        }
    }

    fun play(track: AudioTrack, startWhenReady: Boolean = true, startPositionMs: Int = 0) {
        if (selectionTracks.isNotEmpty()) stop()
        selectionTracks = emptyList()
        selectionTitle = null
        playInternal(track, startWhenReady, startPositionMs)
    }

    private fun playInternal(track: AudioTrack, startWhenReady: Boolean = true, startPositionMs: Int = 0) {
        if (selectionTracks.isEmpty() && currentTrack?.audioUrl == track.audioUrl && !isPreparing && playbackState != AudioPlaybackState.Error) {
            if (startPositionMs > 0) seekTo(startPositionMs)
            if (startWhenReady) resume()
            isVisible = true
            return
        }

        runCatching {
            clipHandler.removeCallbacks(clipWatch)
            mediaPlayer.reset()
            mediaPlayer.setOnSeekCompleteListener(null)
            currentTrack = track
            positionMs = startPositionMs.coerceAtLeast(0)
            durationMs = 0
            bufferedPercent = 0
            isPlaying = false
            isPreparing = true
            isBuffering = false
            isVisible = true
            playWhenReady = startWhenReady
            errorType = null
            playbackState = AudioPlaybackState.Loading
            mediaPlayer.isLooping = repeatEnabled && selectionTracks.isEmpty()
            mediaPlayer.setDataSource(track.audioUrl)
            mediaPlayer.setOnPreparedListener {
                durationMs = ((track.clipEndMs ?: it.duration) - track.clipStartMs).coerceAtLeast(0)
                val maxPosition = durationMs.takeIf { value -> value > 0 } ?: Int.MAX_VALUE
                val safeStartPosition = positionMs.coerceIn(0, maxPosition)
                fun ready() {
                    isPreparing = false
                    if (playWhenReady) {
                        it.start()
                        applyPlaybackSpeed()
                        isPlaying = true
                        playbackState = AudioPlaybackState.Playing
                        if (track.clipEndMs != null) clipHandler.post(clipWatch)
                    } else {
                        isPlaying = false
                        playbackState = AudioPlaybackState.Paused
                    }
                }
                val absoluteStart = track.clipStartMs + safeStartPosition
                if (absoluteStart > 0) {
                    it.setOnSeekCompleteListener { prepared ->
                        prepared.setOnSeekCompleteListener(null)
                        ready()
                    }
                    it.seekTo(absoluteStart.toLong(), MediaPlayer.SEEK_CLOSEST)
                } else {
                    ready()
                }
            }
            mediaPlayer.prepareAsync()
        }.onFailure {
            isPreparing = false
            isBuffering = false
            isPlaying = false
            playWhenReady = false
            errorType = if (track.audioUrl.startsWith("http", ignoreCase = true)) {
                AudioErrorType.Network
            } else {
                AudioErrorType.Unavailable
            }
            playbackState = AudioPlaybackState.Error
        }
    }

    fun pause() {
        clipHandler.removeCallbacks(clipWatch)
        playWhenReady = false
        if (isPlaying) runCatching { mediaPlayer.pause() }
        isPlaying = false
        if (currentTrack != null && playbackState != AudioPlaybackState.Error) {
            playbackState = AudioPlaybackState.Paused
        }
    }

    fun resume() {
        if (playbackState == AudioPlaybackState.Completed && selectionTracks.isNotEmpty()) {
            selectionIndex = 0
            selectionRound = 1
            playInternal(selectionTracks.first())
            return
        }
        playWhenReady = true
        if (isPreparing) return
        if (currentTrack != null && !isPlaying) {
            runCatching {
                if (playbackState == AudioPlaybackState.Completed) mediaPlayer.seekTo(0)
                mediaPlayer.start()
                applyPlaybackSpeed()
            }.onSuccess {
                if (playbackState == AudioPlaybackState.Completed) positionMs = 0
                isPlaying = true
                isVisible = true
                errorType = null
                playbackState = AudioPlaybackState.Playing
                if (currentTrack?.clipEndMs != null) {
                    clipHandler.removeCallbacks(clipWatch)
                    clipHandler.post(clipWatch)
                }
            }.onFailure {
                errorType = AudioErrorType.Unknown
                playbackState = AudioPlaybackState.Error
            }
        }
    }

    fun togglePlayPause() {
        when {
            playbackState == AudioPlaybackState.Error -> retry()
            isPlaying -> pause()
            else -> resume()
        }
    }

    fun retry() {
        val track = currentTrack ?: return
        playInternal(track, startWhenReady = true, startPositionMs = positionMs)
    }

    fun stop() {
        clipHandler.removeCallbacks(clipWatch)
        selectionTracks = emptyList()
        selectionTitle = null
        if (isPlaying || isPreparing || isBuffering) runCatching { mediaPlayer.stop() }
        runCatching { mediaPlayer.reset() }
        isPreparing = false
        isBuffering = false
        isPlaying = false
        isVisible = false
        playWhenReady = false
        currentTrack = null
        positionMs = 0
        durationMs = 0
        bufferedPercent = 0
        sleepTimerEndsAtMs = null
        errorType = null
        playbackState = AudioPlaybackState.Idle
    }

    fun seekTo(position: Int) {
        if (currentTrack == null || isPreparing) return
        val safePosition = position.coerceIn(0, durationMs.takeIf { it > 0 } ?: Int.MAX_VALUE)
        runCatching { mediaPlayer.seekTo((safePosition + (currentTrack?.clipStartMs ?: 0)).toLong(), MediaPlayer.SEEK_CLOSEST) }
            .onSuccess { positionMs = safePosition }
    }

    fun skipBack() = skipBy(-skipIntervalSeconds * 1_000)

    fun skipForward() = skipBy(skipIntervalSeconds * 1_000)

    fun skipBy(deltaMs: Int) {
        seekTo(positionMs + deltaMs)
    }

    fun updatePlaybackSpeed(speed: Float) {
        val normalized = normalizePlaybackSpeed(speed)
        playbackSpeed = normalized
        onPlaybackSpeedChanged(normalized)
        if (isPlaying) applyPlaybackSpeed()
    }

    fun updateSkipInterval(seconds: Int) {
        val normalized = normalizeSkipInterval(seconds)
        skipIntervalSeconds = normalized
        onSkipIntervalChanged(normalized)
    }

    fun updateRepeat(enabled: Boolean) {
        repeatEnabled = enabled
        runCatching { mediaPlayer.isLooping = enabled && selectionTracks.isEmpty() }
        onRepeatChanged(enabled)
    }

    fun updateAutoplay(enabled: Boolean) {
        autoplayEnabled = enabled
        onAutoplayChanged(enabled)
    }

    fun setSleepTimer(minutes: Int?) {
        sleepTimerEndsAtMs = minutes
            ?.takeIf { it > 0 }
            ?.let { System.currentTimeMillis() + it * 60_000L }
    }

    fun replaceCurrentTrack(track: AudioTrack, startWhenReady: Boolean) {
        play(track, startWhenReady = startWhenReady, startPositionMs = positionMs)
    }

    fun updatePosition() {
        if (isPlaying || isBuffering) {
            positionMs = runCatching { mediaPlayer.currentPosition - (currentTrack?.clipStartMs ?: 0) }.getOrDefault(positionMs).coerceAtLeast(0)
            if (currentTrack?.clipEndMs == null) durationMs = runCatching { mediaPlayer.duration }.getOrDefault(durationMs).coerceAtLeast(0)
        }
        val timerEnd = sleepTimerEndsAtMs
        if (timerEnd != null && System.currentTimeMillis() >= timerEnd) {
            sleepTimerEndsAtMs = null
            pause()
        }
    }

    fun release() {
        clipHandler.removeCallbacks(clipWatch)
        runCatching { mediaPlayer.release() }
    }

    private fun applyPlaybackSpeed() {
        runCatching {
            val params = runCatching { mediaPlayer.playbackParams }.getOrElse { PlaybackParams() }
            mediaPlayer.playbackParams = params.setSpeed(playbackSpeed)
        }
    }

    private fun normalizePlaybackSpeed(speed: Float): Float =
        supportedPlaybackSpeeds.minBy { abs(it - speed) }

    private fun normalizeSkipInterval(seconds: Int): Int = if (seconds == 5) 5 else 10
}

@Composable
fun rememberGlobalAudioPlayer(
    initialPlaybackSpeed: Float = 1f,
    initialSkipIntervalSeconds: Int = 10,
    initialRepeatEnabled: Boolean = false,
    initialAutoplayEnabled: Boolean = true,
    onPlaybackSpeedChanged: (Float) -> Unit = {},
    onSkipIntervalChanged: (Int) -> Unit = {},
    onRepeatChanged: (Boolean) -> Unit = {},
    onAutoplayChanged: (Boolean) -> Unit = {},
    resolveNextTrack: (AudioTrack) -> AudioTrack? = { null }
): GlobalAudioPlayer {
    val audioPlayer = remember {
        GlobalAudioPlayer(
            initialPlaybackSpeed = initialPlaybackSpeed,
            initialSkipIntervalSeconds = initialSkipIntervalSeconds,
            initialRepeatEnabled = initialRepeatEnabled,
            initialAutoplayEnabled = initialAutoplayEnabled,
            onPlaybackSpeedChanged = onPlaybackSpeedChanged,
            onSkipIntervalChanged = onSkipIntervalChanged,
            onRepeatChanged = onRepeatChanged,
            onAutoplayChanged = onAutoplayChanged,
            resolveNextTrack = resolveNextTrack
        )
    }
    LaunchedEffect(audioPlayer.isPlaying, audioPlayer.isPreparing, audioPlayer.isVisible, audioPlayer.sleepTimerEndsAtMs) {
        while (audioPlayer.isVisible) {
            audioPlayer.updatePosition()
            delay(if (audioPlayer.isPlaying || audioPlayer.isPreparing) 400 else 1_000)
        }
    }
    DisposableEffect(audioPlayer) {
        onDispose { audioPlayer.release() }
    }
    return audioPlayer
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GlobalMiniPlayer(
    audioPlayer: GlobalAudioPlayer,
    text: AppStrings,
    modifier: Modifier = Modifier
) {
    val track = audioPlayer.currentTrack ?: return
    if (!audioPlayer.isVisible) return
    var expanded by remember { mutableStateOf(false) }
    LaunchedEffect(audioPlayer.playerSheetRequested) {
        if (audioPlayer.playerSheetRequested) {
            expanded = true
            audioPlayer.playerSheetRequested = false
        }
    }
    var speedMenuOpen by remember { mutableStateOf(false) }
    var upwardDrag by remember { mutableStateOf(0f) }
    val progress = audioProgress(audioPlayer.positionMs, audioPlayer.durationMs)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(72.dp)
            .pointerInput(track.audioUrl) {
                detectVerticalDragGestures(
                    onVerticalDrag = { _, amount -> upwardDrag += amount },
                    onDragEnd = {
                        if (upwardDrag < -24f) expanded = true
                        upwardDrag = 0f
                    },
                    onDragCancel = { upwardDrag = 0f }
                )
            }
            .clickable { expanded = true },
        color = TodayFocusSurface,
        tonalElevation = AppElevation.subtle,
        shadowElevation = AppElevation.card,
        shape = RoundedCornerShape(topStart = AppShape.card, topEnd = AppShape.card),
        border = androidx.compose.foundation.BorderStroke(1.dp, TodayFocusBorder)
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 10.dp, end = 6.dp, top = 7.dp, bottom = 7.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        audioPlayer.selectionTitle ?: audioSurahTitle(track),
                        color = GoldLight,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        if (audioPlayer.selectionTitle != null && audioPlayer.playbackState != AudioPlaybackState.Error)
                            text.t("repeat.round", audioPlayer.selectionRound, if (audioPlayer.selectionRounds == 0) "∞" else audioPlayer.selectionRounds.toString())
                        else audioMiniMeta(text, track, audioPlayer),
                        color = if (audioPlayer.playbackState == AudioPlaybackState.Error) DeleteRed else MutedGold,
                        fontSize = 9.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                MiniPlayerIconButton(
                    icon = replayIcon(audioPlayer.skipIntervalSeconds),
                    label = text.t("audio.skipBack", audioPlayer.skipIntervalSeconds),
                    onClick = audioPlayer::skipBack
                )
                MiniPlayerPlayButton(audioPlayer, text)
                MiniPlayerIconButton(
                    icon = forwardIcon(audioPlayer.skipIntervalSeconds),
                    label = text.t("audio.skipForward", audioPlayer.skipIntervalSeconds),
                    onClick = audioPlayer::skipForward
                )
                IconButton(
                    onClick = audioPlayer::stop,
                    modifier = Modifier.size(44.dp).clip(RoundedCornerShape(AppShape.smallControl)).background(GoldSurface)
                ) {
                    Icon(Icons.Default.Stop, contentDescription = text.quranAudioStop, tint = Gold, modifier = Modifier.size(24.dp))
                }
                Box {
                    TextButton(
                        onClick = { speedMenuOpen = true },
                        modifier = Modifier.size(width = 46.dp, height = 42.dp),
                        contentPadding = PaddingValues(0.dp),
                        colors = ButtonDefaults.textButtonColors(contentColor = GoldLight)
                    ) {
                        Text(formatPlaybackSpeed(audioPlayer.playbackSpeed), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                    }
                    AudioSpeedDropdown(
                        expanded = speedMenuOpen,
                        currentSpeed = audioPlayer.playbackSpeed,
                        onDismiss = { speedMenuOpen = false },
                        onSelected = {
                            audioPlayer.updatePlaybackSpeed(it)
                            speedMenuOpen = false
                        }
                    )
                }
            }
            if (audioPlayer.isPreparing || audioPlayer.isBuffering) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth().height(3.dp).align(Alignment.BottomCenter),
                    color = Gold,
                    trackColor = BorderNavy
                )
            } else {
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(3.dp).align(Alignment.BottomCenter),
                    color = DoneGreen,
                    trackColor = BorderNavy
                )
            }
        }
    }

    if (expanded) {
        ExpandedAudioPlayerSheet(
            audioPlayer = audioPlayer,
            text = text,
            track = track,
            onDismiss = { expanded = false }
        )
    }
}

@Composable
private fun MiniPlayerPlayButton(audioPlayer: GlobalAudioPlayer, text: AppStrings) {
    val description = if (audioPlayer.isPlaying) text.quranAudioPause else text.quranAudioPlay
    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(CircleShape)
            .background(Gold)
            .clickable(onClick = audioPlayer::togglePlayPause),
        contentAlignment = Alignment.Center
    ) {
        when {
            audioPlayer.isPreparing -> CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = DarkNavy
            )
            audioPlayer.playbackState == AudioPlaybackState.Error -> Icon(
                Icons.Default.ReplayCircleFilled,
                contentDescription = text.t("audio.retry"),
                tint = DarkNavy,
                modifier = Modifier.size(24.dp)
            )
            else -> Icon(
                if (audioPlayer.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                contentDescription = description,
                tint = DarkNavy,
                modifier = Modifier.size(25.dp)
            )
        }
    }
}

@Composable
private fun MiniPlayerIconButton(icon: ImageVector, label: String, onClick: () -> Unit) {
    IconButton(onClick = onClick, modifier = Modifier.size(42.dp)) {
        Icon(icon, contentDescription = label, tint = GoldLight, modifier = Modifier.size(23.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExpandedAudioPlayerSheet(
    audioPlayer: GlobalAudioPlayer,
    text: AppStrings,
    track: AudioTrack,
    onDismiss: () -> Unit
) {
    var overflowOpen by remember { mutableStateOf(false) }
    val progress = audioProgress(audioPlayer.positionMs, audioPlayer.durationMs)
    val remainingMinutes = audioPlayer.sleepTimerEndsAtMs?.let {
        ((it - System.currentTimeMillis()).coerceAtLeast(0L) / 60_000L).toInt() + 1
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        contentColor = GoldLight,
        dragHandle = {
            Box(
                Modifier
                    .padding(top = 10.dp, bottom = 6.dp)
                    .size(width = 42.dp, height = 4.dp)
                    .clip(CircleShape)
                    .background(BorderNavy)
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .navigationBarsPadding()
                .padding(horizontal = AppSpacing.screen, vertical = AppSpacing.sm),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg)
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Box(
                    modifier = Modifier.size(52.dp).clip(RoundedCornerShape(16.dp)).background(GoldSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.AutoStories, contentDescription = null, tint = Gold, modifier = Modifier.size(27.dp))
                }
                Spacer(Modifier.width(AppSpacing.md))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        audioSurahTitle(track),
                        style = MaterialTheme.typography.titleLarge,
                        color = GoldLight,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (track.surahNameArabic.isNotBlank()) {
                        Text(track.surahNameArabic, color = Gold, fontSize = 16.sp, maxLines = 1)
                    }
                    Text(track.reciterName, color = MutedGold, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    track.ayahNumber?.let {
                        Text(text.quranAudioCurrentAyah.format(it), color = MutedGold, fontSize = 11.sp)
                    }
                }
                Box {
                    IconButton(onClick = { overflowOpen = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = text.t("audio.more"), tint = GoldLight)
                    }
                    DropdownMenu(expanded = overflowOpen, onDismissRequest = { overflowOpen = false }) {
                        DropdownMenuItem(
                            text = { Text(text.quranAudioStop) },
                            leadingIcon = { Icon(Icons.Default.Stop, contentDescription = null) },
                            onClick = {
                                overflowOpen = false
                                onDismiss()
                                audioPlayer.stop()
                            }
                        )
                    }
                }
            }

            AudioStateMessage(audioPlayer, text)

            if (audioPlayer.canConfigureSelection) {
                OutlinedButton(onClick = { onDismiss(); audioPlayer.repeatSheetRequested = true }, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.ReplayCircleFilled, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text(text.t("audio.repeat"))
                }
            }
            audioPlayer.selectionTitle?.let { title ->
                Text("$title · " + text.t("repeat.round", audioPlayer.selectionRound,
                    if (audioPlayer.selectionRounds == 0) "∞" else audioPlayer.selectionRounds.toString()), color = Gold)
            }

            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Slider(
                    value = progress,
                    onValueChange = { value ->
                        if (audioPlayer.durationMs > 0) {
                            audioPlayer.seekTo((value * audioPlayer.durationMs).toInt())
                        }
                    },
                    valueRange = 0f..1f,
                    colors = SliderDefaults.colors(
                        thumbColor = Gold,
                        activeTrackColor = Gold,
                        inactiveTrackColor = BorderNavy
                    )
                )
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(formatAudioPlayerTime(audioPlayer.positionMs), color = MutedGold, fontSize = 11.sp)
                    Text(formatAudioPlayerTime(audioPlayer.durationMs), color = MutedGold, fontSize = 11.sp)
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                ExpandedSkipButton(
                    icon = replayIcon(audioPlayer.skipIntervalSeconds),
                    seconds = audioPlayer.skipIntervalSeconds,
                    description = text.t("audio.skipBack", audioPlayer.skipIntervalSeconds),
                    onClick = audioPlayer::skipBack
                )
                Box(
                    modifier = Modifier.size(64.dp).clip(CircleShape).background(Gold)
                        .clickable(onClick = audioPlayer::togglePlayPause),
                    contentAlignment = Alignment.Center
                ) {
                    if (audioPlayer.isPreparing) {
                        CircularProgressIndicator(Modifier.size(27.dp), strokeWidth = 2.5.dp, color = DarkNavy)
                    } else {
                        Icon(
                            when {
                                audioPlayer.playbackState == AudioPlaybackState.Error -> Icons.Default.ReplayCircleFilled
                                audioPlayer.isPlaying -> Icons.Default.Pause
                                else -> Icons.Default.PlayArrow
                            },
                            contentDescription = if (audioPlayer.isPlaying) text.quranAudioPause else text.quranAudioPlay,
                            tint = DarkNavy,
                            modifier = Modifier.size(34.dp)
                        )
                    }
                }
                ExpandedSkipButton(
                    icon = forwardIcon(audioPlayer.skipIntervalSeconds),
                    seconds = audioPlayer.skipIntervalSeconds,
                    description = text.t("audio.skipForward", audioPlayer.skipIntervalSeconds),
                    onClick = audioPlayer::skipForward
                )
            }

            AudioPreferenceSection(
                title = text.quranAudioPlaybackSpeed,
                options = listOf(0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f),
                selected = audioPlayer.playbackSpeed,
                label = ::formatPlaybackSpeed,
                onSelect = audioPlayer::updatePlaybackSpeed
            )

            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Text(text.t("audio.skipInterval"), color = GoldLight, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                    listOf(5, 10).forEach { seconds ->
                        AudioChoiceButton(
                            label = text.t("audio.seconds", seconds),
                            selected = audioPlayer.skipIntervalSeconds == seconds,
                            modifier = Modifier.weight(1f),
                            onClick = { audioPlayer.updateSkipInterval(seconds) }
                        )
                    }
                }
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = DeepNavy,
                shape = RoundedCornerShape(AppShape.card),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderNavy)
            ) {
                Column {
                    if (audioPlayer.selectionTitle == null && !audioPlayer.canConfigureSelection) AudioToggleRow(
                        icon = Icons.Default.ReplayCircleFilled,
                        title = text.t("audio.repeat"),
                        subtitle = text.t("audio.repeatDescription"),
                        checked = audioPlayer.repeatEnabled,
                        onCheckedChange = audioPlayer::updateRepeat
                    )
                    HorizontalDivider(color = BorderNavy)
                    AudioToggleRow(
                        icon = Icons.Default.AutoStories,
                        title = text.t("audio.autoplay"),
                        subtitle = text.t("audio.autoplayDescription"),
                        checked = audioPlayer.autoplayEnabled,
                        onCheckedChange = audioPlayer::updateAutoplay
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    Icon(Icons.Default.Timer, contentDescription = null, tint = Gold, modifier = Modifier.size(18.dp))
                    Text(
                        remainingMinutes?.let { text.t("audio.sleepTimerActive", it) } ?: text.t("audio.sleepTimer"),
                        color = GoldLight,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(null, 15, 30, 60).forEach { minutes ->
                        AudioChoiceButton(
                            label = minutes?.let { text.t("audio.minutes", it) } ?: text.t("audio.off"),
                            selected = (minutes == null && remainingMinutes == null) ||
                                (minutes != null && remainingMinutes != null && remainingMinutes in (minutes - 1)..minutes),
                            modifier = Modifier.weight(1f),
                            onClick = { audioPlayer.setSleepTimer(minutes) }
                        )
                    }
                }
            }
            Spacer(Modifier.height(AppSpacing.lg))
        }
    }
}

@Composable
private fun AudioStateMessage(audioPlayer: GlobalAudioPlayer, text: AppStrings) {
    val message = audioStateLabel(audioPlayer, text)
    if (message.isBlank()) return
    val isError = audioPlayer.playbackState == AudioPlaybackState.Error
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = if (isError) DeleteRed.copy(alpha = 0.11f) else GoldSurface,
        shape = RoundedCornerShape(AppShape.control)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = AppSpacing.md, vertical = AppSpacing.sm),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)
        ) {
            Icon(
                when {
                    audioPlayer.errorType == AudioErrorType.Network -> Icons.Default.CloudOff
                    isError -> Icons.Default.ErrorOutline
                    else -> Icons.Default.Headphones
                },
                contentDescription = null,
                tint = if (isError) DeleteRed else Gold,
                modifier = Modifier.size(18.dp)
            )
            Text(message, modifier = Modifier.weight(1f), color = if (isError) DeleteRed else GoldLight, fontSize = 11.sp)
            if (isError) {
                TextButton(onClick = audioPlayer::retry) {
                    Text(text.t("audio.retry"), color = Gold, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun ExpandedSkipButton(
    icon: ImageVector,
    seconds: Int,
    description: String,
    onClick: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        IconButton(
            onClick = onClick,
            modifier = Modifier.size(52.dp).clip(CircleShape).background(DeepNavy)
                .border(1.dp, BorderNavy, CircleShape)
        ) {
            Icon(icon, contentDescription = description, tint = GoldLight, modifier = Modifier.size(27.dp))
        }
        Text("${seconds}s", color = MutedGold, fontSize = 9.sp)
    }
}

@Composable
private fun AudioPreferenceSection(
    title: String,
    options: List<Float>,
    selected: Float,
    label: (Float) -> String,
    onSelect: (Float) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
        Text(title, color = GoldLight, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        options.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(AppSpacing.sm)) {
                row.forEach { option ->
                    AudioChoiceButton(
                        label = label(option),
                        selected = abs(selected - option) < 0.01f,
                        modifier = Modifier.weight(1f),
                        onClick = { onSelect(option) }
                    )
                }
            }
        }
    }
}

@Composable
private fun AudioChoiceButton(
    label: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(40.dp),
        shape = RoundedCornerShape(AppShape.control),
        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, if (selected) Gold else BorderNavy),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = if (selected) GoldSurface else DeepNavy,
            contentColor = if (selected) GoldLight else MutedGold
        )
    ) {
        if (selected) {
            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(4.dp))
        }
        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
    }
}

@Composable
private fun AudioToggleRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = AppSpacing.md, vertical = AppSpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.md)
    ) {
        Icon(icon, contentDescription = null, tint = Gold, modifier = Modifier.size(21.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = GoldLight, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = MutedGold, fontSize = 9.sp, lineHeight = 12.sp)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = DarkNavy,
                checkedTrackColor = Gold,
                uncheckedThumbColor = MutedGold,
                uncheckedTrackColor = BorderNavy
            )
        )
    }
}

@Composable
private fun AudioSpeedDropdown(
    expanded: Boolean,
    currentSpeed: Float,
    onDismiss: () -> Unit,
    onSelected: (Float) -> Unit
) {
    DropdownMenu(expanded = expanded, onDismissRequest = onDismiss) {
        listOf(0.75f, 1f, 1.25f, 1.5f, 1.75f, 2f).forEach { speed ->
            DropdownMenuItem(
                text = { Text(formatPlaybackSpeed(speed)) },
                trailingIcon = if (abs(currentSpeed - speed) < 0.01f) {
                    { Icon(Icons.Default.Check, contentDescription = null, tint = Gold) }
                } else null,
                onClick = { onSelected(speed) }
            )
        }
    }
}

private fun replayIcon(seconds: Int): ImageVector =
    if (seconds == 5) Icons.Default.Replay5 else Icons.Default.Replay10

private fun forwardIcon(seconds: Int): ImageVector =
    if (seconds == 5) Icons.Default.Forward5 else Icons.Default.Forward10

private fun audioSurahTitle(track: AudioTrack): String =
    track.surahName.trim().takeIf(String::isNotBlank) ?: "Soera ${track.surahId}"

private fun audioMiniMeta(text: AppStrings, track: AudioTrack, audioPlayer: GlobalAudioPlayer): String {
    val state = audioStateLabel(audioPlayer, text)
    if (state.isNotBlank() && (audioPlayer.isPreparing || audioPlayer.isBuffering || audioPlayer.playbackState == AudioPlaybackState.Error)) {
        return state
    }
    return listOfNotNull(
        track.surahNameArabic.takeIf(String::isNotBlank),
        track.ayahNumber?.let { text.quranAudioCurrentAyah.format(it) },
        track.reciterName.takeIf(String::isNotBlank)
    ).joinToString(" · ")
}

private fun audioStateLabel(audioPlayer: GlobalAudioPlayer, text: AppStrings): String = when (audioPlayer.playbackState) {
    AudioPlaybackState.Loading -> text.t("audio.state.loading")
    AudioPlaybackState.Buffering -> text.t("audio.state.buffering")
    AudioPlaybackState.Playing -> ""
    AudioPlaybackState.Paused -> text.t("audio.state.paused")
    AudioPlaybackState.Completed -> text.t("audio.state.completed")
    AudioPlaybackState.Error -> when (audioPlayer.errorType) {
        AudioErrorType.Network -> text.t("audio.error.network")
        AudioErrorType.Unavailable -> text.t("audio.error.unavailable")
        else -> text.t("audio.error.unknown")
    }
    AudioPlaybackState.Idle -> ""
}

private fun audioProgress(positionMs: Int, durationMs: Int): Float =
    if (durationMs > 0) (positionMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f) else 0f

private fun formatPlaybackSpeed(speed: Float): String =
    if (abs(speed - speed.toInt()) < 0.01f) "${speed.toInt()}×" else "${"%.2f".format(speed).trimEnd('0')}×"

private fun formatAudioPlayerTime(ms: Int): String {
    val totalSeconds = (ms / 1_000).coerceAtLeast(0)
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "$minutes:${seconds.toString().padStart(2, '0')}"
}
