package com.Ameender.qurantracker.notifications

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.data.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import kotlinx.coroutines.withContext

data class NotificationsState(
    val preferences: NotificationPreferences? = null,
    val saving: Boolean = false,
    val status: String? = null,
    val signedIn: Boolean = false,
    val authChecking: Boolean = true,
    val groupsLoading: Boolean = false,
    val groupsError: Boolean = false,
    val groupPush: GroupPushPreferences? = null,
    val groups: List<ReadingGroupDetails> = emptyList(),
    val overrides: Map<String, ReadingGroupNotificationPreferences> = emptyMap()
)

class NotificationsViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = NotificationPreferencesRepository(application)
    private val mutableState = MutableStateFlow(NotificationsState())
    val state = mutableState.asStateFlow()
    private var remoteJob: Job? = null
    init {
        viewModelScope.launch {
            val preferences = withContext(Dispatchers.IO) { repository.load() }
            mutableState.update { it.copy(preferences = preferences) }
        }
        viewModelScope.launch {
            SupabaseService.authenticationState.collectLatest { auth ->
                remoteJob?.cancel()
                mutableState.update { it.copy(authChecking = auth is AuthenticationState.Checking, signedIn = auth is AuthenticationState.Authenticated, groupPush = null, groups = emptyList(), overrides = emptyMap(), groupsError = false) }
                if (auth is AuthenticationState.Authenticated) loadGroups()
            }
        }
    }
    fun save(preferences: NotificationPreferences) {
        if (state.value.saving) return
        viewModelScope.launch {
            mutableState.update { it.copy(saving = true, status = "saving") }
            try {
                repository.save(preferences)
                NotificationCoordinator.reconcileSoon(getApplication())
                GroupPushRegistration.enqueue(getApplication())
                mutableState.update { it.copy(preferences = preferences, status = "saved") }
            } catch (cancel: CancellationException) { throw cancel }
            catch (_: Exception) { mutableState.update { it.copy(status = "error") } }
            finally { mutableState.update { it.copy(saving = false) } }
        }
    }
    fun retryGroups() { remoteJob = viewModelScope.launch { loadGroups() } }
    private suspend fun loadGroups() {
        mutableState.update { it.copy(groupsLoading = true, groupsError = false) }
        try {
            val groups = SupabaseService.loadCurrentUserReadingGroups()
            mutableState.update { it.copy(groups = groups) }
            val push = SupabaseService.loadGroupPushPreferences()
            mutableState.update { it.copy(groupPush = push, groups = groups) }
        } catch (cancel: CancellationException) { throw cancel }
        catch (_: Exception) { mutableState.update { it.copy(groupsError = true) } }
        finally { mutableState.update { it.copy(groupsLoading = false) } }
    }
    fun saveGroupPush(value: GroupPushPreferences) = remoteSave {
        SupabaseService.saveGroupPushPreferences(value)
        mutableState.update { it.copy(groupPush = value) }
    }
    fun loadOverride(code: String) = remoteSave {
        val value = SupabaseService.loadGroupNotificationPreferences(code)
        mutableState.update { it.copy(overrides = it.overrides + (code to value)) }
    }
    fun saveOverride(code: String, level: String) = remoteSave {
        val value = SupabaseService.updateGroupNotificationPreferences(code, level, level != "muted")
        mutableState.update { it.copy(overrides = it.overrides + (code to value)) }
    }
    private fun remoteSave(block: suspend () -> Unit) {
        if (state.value.saving) return
        remoteJob = viewModelScope.launch {
            mutableState.update { it.copy(saving = true, status = "saving") }
            try { block(); mutableState.update { it.copy(status = "saved") } }
            catch (cancel: CancellationException) { throw cancel }
            catch (_: Exception) { mutableState.update { it.copy(status = "error") } }
            finally { mutableState.update { it.copy(saving = false) } }
        }
    }
}
