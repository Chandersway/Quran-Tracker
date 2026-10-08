package com.Ameender.qurantracker.ui

/** Onboarding-only countdown snapshot. Caller supplies monotonic milliseconds; no jobs or storage. */
internal data class FocusDemoTimer(
    val remainingMs: Long = DURATION_MS,
    val startedAt: Long? = null,
    val hasStarted: Boolean = false
) {
    val running get() = startedAt != null
    val seconds get() = ((remainingMs + 999) / 1000).toInt()
    fun sample(now: Long): FocusDemoTimer {
        val start = startedAt ?: return this
        val remaining = (remainingMs - (now - start).coerceAtLeast(0)).coerceAtLeast(0)
        return copy(remainingMs = remaining, startedAt = if (remaining == 0L) null else now)
    }
    fun pause(now: Long) = sample(now).copy(startedAt = null)
    fun toggle(now: Long): FocusDemoTimer = if (running) pause(now) else
        copy(remainingMs = if (remainingMs == 0L) DURATION_MS else remainingMs, startedAt = now, hasStarted = true)
    companion object { const val DURATION_MS = 25 * 60 * 1000L }
}
