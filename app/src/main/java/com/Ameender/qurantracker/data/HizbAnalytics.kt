package com.Ameender.qurantracker.data

import java.time.LocalDate
import java.time.ZoneId

enum class HizbPeriod { Week, Month, Year, Custom }
data class HizbDateRange(val from: LocalDate, val through: LocalDate) {
    init { require(!from.isAfter(through)) }
    fun bounds(zone: ZoneId = ZoneId.systemDefault()) =
        from.atStartOfDay(zone).toInstant().toEpochMilli() to through.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
}
fun hizbDateRange(period: HizbPeriod, today: LocalDate = LocalDate.now()): HizbDateRange = HizbDateRange(
    when (period) { HizbPeriod.Week -> today.minusDays(6); HizbPeriod.Month -> today.minusMonths(1).plusDays(1); HizbPeriod.Year -> today.minusYears(1).plusDays(1); HizbPeriod.Custom -> today }, today)
fun completeHizbCounts(rows: List<HizbReadingCount>): List<HizbReadingCount> {
    val counts = rows.associate { it.hizbNumber to it.count }
    return (1..60).map { HizbReadingCount(it, counts[it] ?: 0) }
}
fun currentHistoryOwner(): String = when(val auth = SupabaseService.authenticationState.value) {
    is AuthenticationState.Authenticated -> auth.userId
    AuthenticationState.SignedOut -> "guest"
    AuthenticationState.Checking -> error("AUTH_CHECKING")
}
