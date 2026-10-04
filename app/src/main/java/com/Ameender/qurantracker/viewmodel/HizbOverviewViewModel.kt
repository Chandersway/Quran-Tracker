package com.Ameender.qurantracker.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.ExperimentalCoroutinesApi

sealed interface HizbOverviewState {
    data object Loading : HizbOverviewState
    data object Error : HizbOverviewState
    data class Ready(val range: HizbDateRange, val counts: List<HizbReadingCount>) : HizbOverviewState
}
@OptIn(ExperimentalCoroutinesApi::class)
class HizbOverviewViewModel(application: Application) : AndroidViewModel(application) {
    private val dao = QuranDatabase.getDatabase(application).readingHistoryDao()
    val range = MutableStateFlow(hizbDateRange(HizbPeriod.Week))
    private val retry = MutableStateFlow(0)
    fun retry() { retry.value++ }
    val state = combine(range, SupabaseService.authenticationState, retry) { range, auth, _ -> range to auth }
        .flatMapLatest { (range, auth) ->
            if (auth is AuthenticationState.Checking) flowOf<HizbOverviewState>(HizbOverviewState.Loading)
            else {
                val owner = (auth as? AuthenticationState.Authenticated)?.userId ?: "guest"
                val (start, end) = range.bounds()
                dao.hizbCounts(owner, start, end)
                    .map<List<HizbReadingCount>, HizbOverviewState> { HizbOverviewState.Ready(range, completeHizbCounts(it)) }
                    .onStart { emit(HizbOverviewState.Loading) }
                    .catch { emit(HizbOverviewState.Error) }
            }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000, replayExpirationMillis = 0), HizbOverviewState.Loading)
}
