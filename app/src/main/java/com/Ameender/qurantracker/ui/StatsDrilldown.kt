package com.Ameender.qurantracker.ui

import com.Ameender.qurantracker.data.ReadingHistory
import java.time.Instant
import java.time.ZoneId
import kotlin.math.atan2
import kotlin.math.hypot

internal enum class StatsReadingPeriod(val days: Long?) { All(null), Week(7), Month(30) }
internal enum class StatsDistribution { Type, Hizb, Surah }
internal data class StatsReadingBucket(val key: String, val rows: List<ReadingHistory>)

internal fun statsPeriodHistory(
    history: List<ReadingHistory>, period: StatsReadingPeriod,
    now: Instant = Instant.now(), zone: ZoneId = ZoneId.systemDefault()
): List<ReadingHistory> {
    val days = period.days ?: return history
    val today = now.atZone(zone).toLocalDate()
    val start = today.minusDays(days - 1).atStartOfDay(zone).toInstant().toEpochMilli()
    val end = today.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
    return history.filter { it.timestamp >= start && it.timestamp < end }
}

/** Counts registrations, not their amount. The same rows drive the ring and drilldown. */
internal fun statsReadingBuckets(history: List<ReadingHistory>, kind: StatsDistribution): List<StatsReadingBucket> =
    history.filter { it.action == "read" }.filter {
        when (kind) {
            StatsDistribution.Type -> true
            StatsDistribution.Hizb -> it.type in listOf("hizb", "rub") || it.contentType == "hizb"
            StatsDistribution.Surah -> it.type == "surah" || it.contentType == "surah"
        }
    }.groupBy {
        if (kind == StatsDistribution.Type) it.contentType.ifEmpty { it.type } else it.surahId.toString()
    }.map { (key, rows) -> StatsReadingBucket(key, rows.sortedWith(compareByDescending<ReadingHistory> { it.timestamp }.thenByDescending { it.id })) }
        .sortedWith(compareByDescending<StatsReadingBucket> { it.rows.size }.thenBy { it.key })
        .let { if (kind == StatsDistribution.Type) it else it.take(8) }

/** Canvas arcs start at the top and run clockwise, independent of interface direction. */
internal fun statsRingSegment(x: Float, y: Float, diameter: Float, stroke: Float, counts: List<Int>): Int? {
    if (diameter <= 0f || stroke <= 0f) return null
    val radius = diameter / 2f
    val distance = hypot(x - radius, y - radius)
    if (distance < radius - stroke || distance > radius) return null
    val total = counts.sumOf { it.coerceAtLeast(0).toLong() }
    if (total == 0L) return null
    val angle = (Math.toDegrees(atan2((y - radius).toDouble(), (x - radius).toDouble())) + 450.0) % 360.0
    var end = 0.0
    counts.forEachIndexed { index, count ->
        end += count.coerceAtLeast(0).toDouble() / total * 360.0
        if (count > 0 && angle < end) return index
    }
    return null
}
