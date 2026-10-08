package com.Ameender.qurantracker.data

import android.content.Intent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.ExternalAuthAction
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.status.SessionSource
import io.github.jan.supabase.auth.user.UserInfo
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.rpc
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.storage.storage
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

data class ReadingGroupDetails(
    val code: String,
    val name: String,
    val description: String,
    val goal: String,
    val unit: String,
    val isOwner: Boolean,
    val createdAt: String = "",
    val serverId: String = "",
    val privacy: String = "restricted",
    val goalPeriod: String = "none",
    val goalTarget: Int? = null,
    val currentRole: String = if (isOwner) "owner" else "member",
    val languageCode: String = "nl",
    val permissions: Set<String> = emptySet(),
    val joinRequestStatus: String? = null,
    val unreadNotificationCount: Int = 0,
    val activeRulesVersion: Int? = null
)

@Serializable
data class ReadingGroupMemberRow(
    @SerialName("group_code") val groupCode: String,
    @SerialName("user_id") val userId: String,
    @SerialName("display_name") val displayName: String = "",
    val role: String = "member",
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("joined_at") val joinedAt: String = "",
    val isCurrentUser: Boolean = false
)

data class ReadingGroupRoleRow(
    val key: String,
    val name: String,
    val rank: Int
)

data class ReadingGroupInvitationRow(
    val id: String,
    val token: String? = null,
    val invitedEmail: String? = null,
    val status: String,
    val maxUses: Int,
    val useCount: Int,
    val expiresAt: String,
    val createdAt: String
)

data class ReadingGroupJoinRequestRow(
    val id: String,
    val userId: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val message: String,
    val status: String,
    val createdAt: String,
    val reviewedAt: String? = null
)

data class ReadingGroupMediaItem(
    val id: String,
    val attachmentId: String,
    val sourcePostId: String? = null,
    val storagePath: String,
    val signedUrl: String,
    val mimeType: String,
    val fileName: String,
    val byteSize: Long,
    val width: Int? = null,
    val height: Int? = null,
    val createdBy: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val caption: String = "",
    val createdAt: String,
    val canDelete: Boolean,
    val isMine: Boolean
)

data class ReadingGroupTaskItem(
    val id: String,
    val title: String,
    val description: String,
    val taskType: String,
    val targetValue: Int,
    val targetUnit: String,
    val startsAt: String? = null,
    val dueAt: String? = null,
    val status: String,
    val createdBy: String,
    val displayName: String,
    val createdAt: String,
    val participantCount: Int,
    val completedCount: Int,
    val myProgress: Int,
    val myCompleted: Boolean,
    val canManage: Boolean,
    val pointsReward: Int = 0,
    val myPointsAwarded: Boolean = false
)

data class ReadingGroupProfile(
    val userId: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val customDisplayName: String? = null,
    val customAvatarUrl: String? = null
)

data class ReadingGroupEventItem(
    val id: String,
    val title: String,
    val description: String,
    val startsAt: String,
    val endsAt: String? = null,
    val timezone: String,
    val location: String,
    val status: String,
    val createdBy: String,
    val displayName: String,
    val createdAt: String,
    val goingCount: Int,
    val maybeCount: Int,
    val declinedCount: Int,
    val myResponse: String? = null,
    val canManage: Boolean = false
)

data class ReadingGroupRule(
    val id: String,
    val version: Int,
    val content: String,
    val updatedAt: String,
    val createdBy: String,
    val displayName: String
)

data class ReadingGroupNotificationPreferences(
    val level: String = "all",
    val pushEnabled: Boolean = true,
    val mutedUntil: String? = null,
    val updatedAt: String = ""
)

data class ReadingGroupNotification(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val entityType: String? = null,
    val entityId: String? = null,
    val readAt: String? = null,
    val createdAt: String
)

data class ReadingGroupModerationReport(
    val id: String,
    val reporterId: String,
    val reporterName: String,
    val targetType: String,
    val targetId: String? = null,
    val reason: String,
    val details: String,
    val status: String,
    val assignedTo: String? = null,
    val resolvedBy: String? = null,
    val resolvedAt: String? = null,
    val resolutionNote: String? = null,
    val createdAt: String,
    val updatedAt: String
)

data class ReadingGroupAuditEntry(
    val id: Long,
    val actorId: String? = null,
    val actorName: String,
    val action: String,
    val targetType: String? = null,
    val targetId: String? = null,
    val metadata: JsonObject,
    val createdAt: String
)

@Serializable
data class ProfileUpsert(
    val id: String,
    @SerialName("display_name") val displayName: String,
    @SerialName("avatar_url") val avatarUrl: String? = null
)

@Serializable
data class ProfileRow(
    val id: String,
    @SerialName("display_name") val displayName: String = "",
    @SerialName("avatar_url") val avatarUrl: String? = null
)

data class ReadingGroupLeaderboardRow(
    val userId: String,
    val label: String,
    val avatarUrl: String? = null,
    val totalPoints: Int,
    val totalAyahEquivalent: Int,
    val details: String,
    val pages: Int = 0,
    val hizb: Int = 0,
    val juz: Int = 0,
    val surah: Int = 0,
    val streak: Int = 0,
    val activeToday: Boolean = false,
    val weeklyPoints: Int = 0,
    val monthlyPoints: Int = 0
)

data class ReadingGroupFeedItem(
    val id: Long,
    val displayName: String,
    val type: String,
    val message: String,
    val unit: String?,
    val amount: Int?,
    val createdAt: String,
    val likeCount: Int = 0,
    val commentCount: Int = 0,
    val likedByMe: Boolean = false,
    val comments: List<ReadingGroupCommentItem> = emptyList(),
    val serverId: String = "",
    val isPinned: Boolean = false,
    val createdBy: String = "",
    val isMine: Boolean = false,
    val myReaction: String? = null,
    val reactionCounts: Map<String, Int> = emptyMap(),
    val editedAt: String? = null,
    val avatarUrl: String? = null,
    val mediaUrl: String? = null,
    val mediaMimeType: String? = null,
    val mediaFileName: String? = null
)

data class ReadingGroupCommentItem(
    val id: Long,
    val displayName: String,
    val content: String,
    val createdAt: String,
    val serverId: String = "",
    val createdBy: String = "",
    val isMine: Boolean = false
)

data class UserAccount(
    val email: String,
    val displayName: String,
    val avatarUrl: String?,
    val provider: String,
    val customDisplayName: String? = null,
    val uploadedDisplayName: String? = null,
    val providerDisplayName: String? = null,
    val customAvatarUrl: String? = null,
    val uploadedAvatarUrl: String? = null,
    val providerAvatarUrl: String? = null
) {
    val displayAvatarUrl: String?
        get() = ProfileAvatarService.resolveAvatarUrl(
            customAvatarUrl = customAvatarUrl,
            uploadedAvatarUrl = uploadedAvatarUrl,
            googlePhotoUrl = providerAvatarUrl
        )
}

object SupabaseConfig {
    const val URL = "https://tboaaxcdnajgttdanfmb.supabase.co"
    const val ANON_KEY = "sb_publishable_S54PfHpFCAA7YZILnQEoOg_RSqT7QMU"
    const val DEEPLINK_SCHEME = "qurantracker"
    const val DEEPLINK_HOST = "auth"

    val isConfigured: Boolean
        get() = URL.startsWith("https://") && ANON_KEY.isNotBlank()
}

object SupabaseService {
    private val clientOrNull: SupabaseClient? by lazy {
        if (!SupabaseConfig.isConfigured) {
            null
        } else {
            createSupabaseClient(
                supabaseUrl = SupabaseConfig.URL,
                supabaseKey = SupabaseConfig.ANON_KEY
            ) {
                install(Auth) {
                    scheme = SupabaseConfig.DEEPLINK_SCHEME
                    host = SupabaseConfig.DEEPLINK_HOST
                    defaultExternalAuthAction = ExternalAuthAction.CustomTabs()
                }
                install(Postgrest)
                install(Storage)
            }
        }
    }

    private val client: SupabaseClient
        get() = clientOrNull ?: error("Supabase is nog niet ingesteld.")

    private val groupRepository: GroupV2Repository by lazy { GroupV2Repository(client) }

    private val authScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val _authenticationState = MutableStateFlow<AuthenticationState>(AuthenticationState.Checking)
    val authenticationState: StateFlow<AuthenticationState> = _authenticationState.asStateFlow()
    private val _passwordRecovery = MutableStateFlow(false)
    val passwordRecovery: StateFlow<Boolean> = _passwordRecovery.asStateFlow()
    private val _accountDeleted = MutableStateFlow(false)
    val accountDeleted: StateFlow<Boolean> = _accountDeleted.asStateFlow()
    fun consumeAccountDeletionNotice() { _accountDeleted.value = false }

    init {
        val authClient = clientOrNull?.auth
        if (authClient == null) {
            _authenticationState.value = AuthenticationState.SignedOut
        } else {
            authScope.launch {
                authClient.sessionStatus.collectLatest { status ->
                    if (status is SessionStatus.Authenticated && status.source == SessionSource.External &&
                        status.session.type == "recovery") _passwordRecovery.value = true
                    if (status is SessionStatus.NotAuthenticated) _passwordRecovery.value = false
                    _authenticationState.value = when (status) {
                        is SessionStatus.Authenticated -> authClient.currentUserOrNull()
                            ?.toAuthenticationState()
                            ?: AuthenticationState.Checking
                        is SessionStatus.NotAuthenticated -> AuthenticationState.SignedOut
                        SessionStatus.Initializing,
                        is SessionStatus.RefreshFailure -> AuthenticationState.Checking
                    }
                }
            }
        }
    }

    private fun UserInfo.toAuthenticationState(): AuthenticationState.Authenticated =
        AuthenticationState.Authenticated(userId = id, email = email)

    private suspend fun synchronizeAuthenticationState(): AuthenticationState {
        val authClient = clientOrNull?.auth
        if (authClient == null) {
            return AuthenticationState.SignedOut.also { _authenticationState.value = it }
        }
        authClient.awaitInitialization()
        return (authClient.currentUserOrNull()?.toAuthenticationState()
            ?: AuthenticationState.SignedOut).also { _authenticationState.value = it }
    }

    private suspend fun authenticatedUserOrNull(forceRefresh: Boolean = false): UserInfo? {
        val authClient = clientOrNull?.auth ?: return null
        authClient.awaitInitialization()
        if (authClient.currentUserOrNull() == null) return null
        if (forceRefresh) {
            authClient.refreshCurrentSession()
        }
        return authClient.currentUserOrNull()
    }

    suspend fun currentUserEmail(): String? {
        return authenticatedUserOrNull()?.email
    }

    suspend fun isAuthenticated(): Boolean = authenticatedUserOrNull() != null

    suspend fun currentUserAccount(): UserAccount? {
        val user = authenticatedUserOrNull() ?: return null
        val profile = runCatching { loadProfile() }.getOrNull()
        val metadata = user.userMetadata
        val email = user.email.orEmpty()
        val metadataName = metadata.stringValue("full_name")
            ?: metadata.stringValue("name")
            ?: metadata.stringValue("display_name")
        val providerName = metadataName?.takeIf { it.isNotBlank() }
        val customName = profile?.displayName
            ?.takeIf { it.isNotBlank() }
            ?.takeUnless { isProviderDisplayName(it, providerName) }
        val metadataAvatar = metadata.stringValue("avatar_url")
            ?: metadata.stringValue("picture")
        val providerAvatar = metadataAvatar?.takeIf { it.isNotBlank() }
        val customAvatar = profile?.avatarUrl
            ?.takeIf { it.isNotBlank() }
            ?.takeUnless { isProviderAvatarUrl(it, providerAvatar) }
        return UserAccount(
            email = email,
            displayName = ProfileAvatarService.resolveDisplayName(
                customDisplayName = customName,
                uploadedDisplayName = null,
                googleDisplayName = providerName,
                fallbackEmail = email
            ),
            avatarUrl = ProfileAvatarService.resolveAvatarUrl(
                customAvatarUrl = customAvatar,
                uploadedAvatarUrl = null,
                googlePhotoUrl = providerAvatar
            ),
            provider = user.appMetadata.stringValue("provider") ?: "email",
            customDisplayName = customName,
            providerDisplayName = providerName,
            customAvatarUrl = customAvatar,
            providerAvatarUrl = providerAvatar
        )
    }

    private fun isProviderDisplayName(profileDisplayName: String, providerDisplayName: String?): Boolean {
        return providerDisplayName != null &&
            profileDisplayName.trim().equals(providerDisplayName.trim(), ignoreCase = true)
    }

    private fun isProviderAvatarUrl(profileAvatarUrl: String, providerAvatarUrl: String?): Boolean {
        val profileBaseUrl = profileAvatarUrl.substringBefore("?")
        val providerBaseUrl = providerAvatarUrl?.substringBefore("?")
        return profileBaseUrl == providerBaseUrl ||
            profileBaseUrl.contains("googleusercontent.com", ignoreCase = true)
    }

    private suspend fun loadProfile(): ProfileRow? {
        val user = authenticatedUserOrNull() ?: return null
        return client.from("profiles")
            .select {
                filter { eq("id", user.id) }
                single()
            }
            .decodeSingleOrNull<ProfileRow>()
    }

    suspend fun saveProfileName(name: String) {
        val user = client.auth.currentUserOrNull() ?: error("Log eerst in om je profielnaam op te slaan.")
        val safeName = name.trim().take(40)
        if (safeName.isBlank()) error("Vul eerst een profielnaam in.")
        val profile = runCatching { loadProfile() }.getOrNull()
        client.from("profiles").upsert(
            ProfileUpsert(
                id = user.id,
                displayName = safeName,
                avatarUrl = profile?.avatarUrl?.takeIf { it.isNotBlank() }
            )
        )
    }

    suspend fun uploadProfileAvatar(bytes: ByteArray, mimeType: String): String {
        val user = client.auth.currentUserOrNull() ?: error("Log eerst in om een profielfoto te uploaden.")
        val profile = runCatching { loadProfile() }.getOrNull()
        val providerName = user.userMetadata.stringValue("full_name")
            ?: user.userMetadata.stringValue("name")
            ?: user.userMetadata.stringValue("display_name")
        val profileDisplayName = profile?.displayName
            ?.takeIf { it.isNotBlank() }
            ?.takeUnless { isProviderDisplayName(it, providerName) }
        val extension = when {
            mimeType.contains("png", ignoreCase = true) -> "png"
            mimeType.contains("webp", ignoreCase = true) -> "webp"
            else -> "jpg"
        }
        val path = "${user.id}/avatar.$extension"
        client.storage.from("avatars").upload(path, bytes) {
            upsert = true
        }
        val publicUrl = client.storage.from("avatars").publicUrl(path)
        val versionedPublicUrl = "$publicUrl?v=${System.currentTimeMillis()}"
        client.from("profiles").upsert(
            ProfileUpsert(
                id = user.id,
                displayName = profileDisplayName
                    ?: user.email?.substringBefore("@").orEmpty(),
                avatarUrl = versionedPublicUrl
            )
        )
        return versionedPublicUrl
    }

    private suspend fun currentDisplayName(fallbackEmail: String?): String {
        return currentUserAccount()?.displayName ?: fallbackEmail ?: "Gebruiker"
    }

    private suspend fun ensureProfileExists(user: UserInfo, displayName: String) {
        client.from("profiles").upsert(
            ProfileUpsert(
                id = user.id,
                displayName = displayName,
                avatarUrl = null
            )
        ) {
            onConflict = "id"
            ignoreDuplicates = true
        }
    }

    suspend fun createReadingGroup(
        name: String,
        description: String,
        goal: String,
        unit: String,
        code: String,
        goalPeriod: String = "none",
        goalTarget: Int? = null,
        privacy: String = "restricted"
    ): ReadingGroupDetails {
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om een groep te maken.")
        val displayName = currentDisplayName(user.email)
        ensureProfileExists(user, displayName)
        return groupRepository.createGroup(
            currentUserId = user.id,
            name = name,
            description = description,
            goalType = goal,
            progressUnit = unit,
            goalPeriod = goalPeriod,
            goalTarget = goalTarget,
            privacy = privacy,
            code = code
        )
    }

    suspend fun joinReadingGroup(code: String): ReadingGroupDetails {
        val cleanCode = code.trim().uppercase()
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om deel te nemen aan een groep.")
        val displayName = currentDisplayName(user.email)
        ensureProfileExists(user, displayName)
        return groupRepository.joinGroup(user.id, cleanCode, displayName)
    }

    suspend fun loadReadingGroup(code: String): ReadingGroupDetails {
        val user = authenticatedUserOrNull()
            ?: error("Je sessie is verlopen. Log opnieuw in om groepen te gebruiken.")
        return loadReadingGroupForUser(code, user.id)
    }

    private suspend fun loadReadingGroupForUser(code: String, currentUserId: String): ReadingGroupDetails {
        return groupRepository.loadGroup(code, currentUserId)
    }

    suspend fun loadCurrentUserReadingGroups(): List<ReadingGroupDetails> {
        val user = authenticatedUserOrNull() ?: return emptyList()
        return groupRepository.loadCurrentUserGroups(user.id)
    }

    suspend fun loadCurrentUserReadingGroup(): ReadingGroupDetails? {
        return loadCurrentUserReadingGroups().firstOrNull()
    }

    suspend fun updateReadingGroup(
        code: String,
        name: String,
        description: String,
        goal: String,
        unit: String,
        goalPeriod: String = "none",
        goalTarget: Int? = null,
        privacy: String = "restricted"
    ): ReadingGroupDetails {
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om groepen te wijzigen.")
        return groupRepository.updateGroup(
            currentUserId = user.id,
            code = code,
            name = name,
            description = description,
            goalType = goal,
            progressUnit = unit,
            goalPeriod = goalPeriod,
            goalTarget = goalTarget,
            privacy = privacy
        )
    }

    suspend fun deleteReadingGroup(code: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om een groep te verwijderen.")
        groupRepository.deleteGroup(code)
    }

    suspend fun loadGroupMembers(code: String): List<ReadingGroupMemberRow> {
        return groupRepository.loadMembers(code, authenticatedUserOrNull()?.id)
    }

    suspend fun loadMyGroupProfile(code: String): ReadingGroupProfile {
        authenticatedUserOrNull() ?: error("Je sessie is verlopen. Log opnieuw in om je groepsprofiel te bekijken.")
        return groupRepository.loadMyGroupProfile(code)
    }

    suspend fun updateMyGroupProfile(
        code: String,
        displayName: String?,
        avatarUrl: String?
    ): ReadingGroupProfile {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om je groepsprofiel te wijzigen.")
        return groupRepository.updateMyGroupProfile(code, displayName, avatarUrl)
    }

    suspend fun uploadGroupProfileAvatar(code: String, bytes: ByteArray, mimeType: String): String {
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om een groepsfoto te uploaden.")
        if (bytes.isEmpty() || bytes.size > 5 * 1024 * 1024) {
            error("Kies een afbeelding van maximaal 5 MB.")
        }
        return groupRepository.uploadGroupProfileAvatar(code, user.id, bytes, mimeType)
    }

    suspend fun loadGroupRoles(code: String): List<ReadingGroupRoleRow> {
        authenticatedUserOrNull() ?: error("Je sessie is verlopen. Log opnieuw in om rollen te bekijken.")
        return groupRepository.loadRoles(code)
    }

    suspend fun loadGroupLogo(code: String): String? = groupRepository.loadGroupLogo(code)

    suspend fun setGroupLogo(code: String, bytes: ByteArray?, mimeType: String = "image/jpeg") {
        authenticatedUserOrNull(forceRefresh = true) ?: error("Log opnieuw in om het groepslogo te wijzigen.")
        groupRepository.setGroupLogo(code, bytes, mimeType)
    }

    suspend fun setGroupMemberRole(code: String, userId: String, roleKey: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om rollen te wijzigen.")
        groupRepository.setMemberRole(code, userId, roleKey)
    }

    suspend fun removeGroupMember(code: String, userId: String, block: Boolean) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om leden te beheren.")
        groupRepository.removeMember(code, userId, block)
    }

    suspend fun createGroupInvitation(
        code: String,
        invitedEmail: String?,
        expiresDays: Int,
        maxUses: Int
    ): ReadingGroupInvitationRow {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om leden uit te nodigen.")
        return groupRepository.createInvitation(code, invitedEmail, expiresDays, maxUses)
    }

    suspend fun loadGroupInvitations(code: String): List<ReadingGroupInvitationRow> {
        authenticatedUserOrNull() ?: error("Je sessie is verlopen. Log opnieuw in om uitnodigingen te bekijken.")
        return groupRepository.loadInvitations(code)
    }

    suspend fun revokeGroupInvitation(code: String, invitationId: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om uitnodigingen in te trekken.")
        groupRepository.revokeInvitation(code, invitationId)
    }

    suspend fun acceptGroupInvitation(token: String): ReadingGroupDetails {
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om de uitnodiging te accepteren.")
        val displayName = currentDisplayName(user.email)
        ensureProfileExists(user, displayName)
        return groupRepository.acceptInvitation(user.id, token.trim(), displayName)
    }

    suspend fun createGroupJoinRequest(code: String, message: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om toegang aan te vragen.")
        groupRepository.createJoinRequest(code, message.trim().take(500))
    }

    suspend fun loadGroupJoinRequests(code: String): List<ReadingGroupJoinRequestRow> {
        authenticatedUserOrNull() ?: error("Je sessie is verlopen. Log opnieuw in om verzoeken te bekijken.")
        return groupRepository.loadJoinRequests(code)
    }

    suspend fun reviewGroupJoinRequest(code: String, requestId: String, approve: Boolean) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om verzoeken te beoordelen.")
        groupRepository.reviewJoinRequest(code, requestId, approve)
    }

    suspend fun loadGroupMedia(code: String): List<ReadingGroupMediaItem> {
        val user = authenticatedUserOrNull()
            ?: error("Je sessie is verlopen. Log opnieuw in om groepsmedia te bekijken.")
        return groupRepository.loadMedia(code, user.id)
    }

    suspend fun uploadGroupMedia(
        code: String,
        bytes: ByteArray,
        mimeType: String,
        fileName: String,
        caption: String
    ): ReadingGroupMediaItem {
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om media te uploaden.")
        if (bytes.isEmpty() || bytes.size > 10 * 1024 * 1024) {
            error("Kies een afbeelding van maximaal 10 MB.")
        }
        return groupRepository.uploadMedia(
            code = code,
            currentUserId = user.id,
            bytes = bytes,
            mimeType = mimeType,
            fileName = fileName,
            caption = caption.trim().take(1000)
        )
    }

    suspend fun deleteGroupMedia(code: String, mediaId: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om media te verwijderen.")
        groupRepository.deleteMedia(code, mediaId)
    }

    suspend fun loadGroupTasks(code: String): List<ReadingGroupTaskItem> {
        authenticatedUserOrNull() ?: error("Je sessie is verlopen. Log opnieuw in om taken te bekijken.")
        return groupRepository.loadTasks(code)
    }

    suspend fun createGroupTask(
        code: String,
        title: String,
        description: String,
        taskType: String,
        targetValue: Int,
        targetUnit: String,
        durationDays: Int?,
        pointsReward: Int
    ) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om een challenge te maken.")
        groupRepository.createTask(
            code = code,
            title = title,
            description = description,
            taskType = taskType,
            targetValue = targetValue,
            targetUnit = targetUnit,
            durationDays = durationDays,
            pointsReward = pointsReward
        )
    }

    suspend fun updateGroupTaskProgress(code: String, taskId: String, progress: Int): Int {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om voortgang bij te werken.")
        return groupRepository.setTaskProgress(code, taskId, progress)
    }

    suspend fun updateGroupTaskStatus(code: String, taskId: String, status: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om de challenge te beheren.")
        groupRepository.setTaskStatus(code, taskId, status)
    }

    suspend fun loadGroupEvents(code: String): List<ReadingGroupEventItem> {
        authenticatedUserOrNull() ?: error("Je sessie is verlopen. Log opnieuw in om evenementen te bekijken.")
        return groupRepository.loadEvents(code)
    }

    suspend fun createGroupEvent(
        code: String,
        title: String,
        description: String,
        startsAt: String,
        endsAt: String?,
        timezone: String,
        location: String
    ) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om een evenement te maken.")
        groupRepository.createEvent(code, title, description, startsAt, endsAt, timezone, location)
    }

    suspend fun respondToGroupEvent(code: String, eventId: String, response: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om te reageren.")
        groupRepository.respondToEvent(code, eventId, response)
    }

    suspend fun updateGroupEventStatus(code: String, eventId: String, status: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om het evenement te beheren.")
        groupRepository.setEventStatus(code, eventId, status)
    }

    suspend fun loadGroupRules(code: String): ReadingGroupRule? {
        authenticatedUserOrNull()
            ?: error("Je sessie is verlopen. Log opnieuw in om groepsregels te bekijken.")
        return groupRepository.loadRules(code)
    }

    suspend fun publishGroupRules(code: String, content: String): ReadingGroupRule {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om groepsregels te wijzigen.")
        val safeContent = content.trim().take(10_000)
        if (safeContent.isBlank()) error("Vul eerst groepsregels in.")
        return groupRepository.publishRules(code, safeContent)
    }

    suspend fun loadGroupNotificationPreferences(code: String): ReadingGroupNotificationPreferences {
        authenticatedUserOrNull()
            ?: error("Je sessie is verlopen. Log opnieuw in om meldingsinstellingen te bekijken.")
        return groupRepository.loadNotificationPreferences(code)
    }

    suspend fun loadGroupPushPreferences(): com.Ameender.qurantracker.notifications.GroupPushPreferences {
        val user = authenticatedUserOrNull() ?: error("AUTH_REQUIRED")
        return client.from("notification_preferences").select {
            filter { eq("user_id", user.id) }
        }.decodeSingleOrNull<com.Ameender.qurantracker.notifications.GroupPushPreferences>()
            ?: com.Ameender.qurantracker.notifications.GroupPushPreferences(user.id)
    }

    suspend fun saveGroupPushPreferences(value: com.Ameender.qurantracker.notifications.GroupPushPreferences) {
        val user = authenticatedUserOrNull() ?: error("AUTH_REQUIRED")
        require(value.userId == user.id)
        client.from("notification_preferences").upsert(value)
    }

    suspend fun updateGroupNotificationPreferences(
        code: String,
        level: String,
        pushEnabled: Boolean,
        mutedUntil: String? = null
    ): ReadingGroupNotificationPreferences {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om meldingsinstellingen te wijzigen.")
        return groupRepository.updateNotificationPreferences(code, level, pushEnabled, mutedUntil)
    }

    suspend fun loadGroupNotifications(
        code: String,
        limit: Int = 30,
        beforeCreatedAt: String? = null,
        beforeId: String? = null
    ): List<ReadingGroupNotification> {
        authenticatedUserOrNull()
            ?: error("Je sessie is verlopen. Log opnieuw in om meldingen te bekijken.")
        return groupRepository.loadNotifications(code, limit, beforeCreatedAt, beforeId)
    }

    suspend fun markGroupNotificationRead(
        code: String,
        notificationId: String? = null,
        read: Boolean = true
    ): Int {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om meldingen bij te werken.")
        return groupRepository.markNotificationRead(code, notificationId, read)
    }

    suspend fun sendGroupNotification(
        code: String,
        title: String,
        body: String,
        type: String = "important",
        entityType: String? = null,
        entityId: String? = null
    ): Int {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om een groepsmelding te versturen.")
        val safeTitle = title.trim().take(160)
        val safeBody = body.trim().take(1_000)
        if (safeTitle.isBlank()) error("Vul eerst een titel voor de melding in.")
        return groupRepository.sendNotification(
            code, safeTitle, safeBody, type, entityType, entityId
        )
    }

    suspend fun loadGroupModerationReports(
        code: String,
        status: String? = null,
        limit: Int = 30,
        beforeCreatedAt: String? = null,
        beforeId: String? = null
    ): List<ReadingGroupModerationReport> {
        authenticatedUserOrNull()
            ?: error("Je sessie is verlopen. Log opnieuw in om rapportages te bekijken.")
        return groupRepository.loadModerationReports(code, status, limit, beforeCreatedAt, beforeId)
    }

    suspend fun reviewGroupModerationReport(
        code: String,
        reportId: String,
        status: String,
        resolutionNote: String? = null
    ) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om rapportages te beheren.")
        groupRepository.reviewModerationReport(
            code, reportId, status, resolutionNote?.trim()?.take(2_000)
        )
    }

    suspend fun loadGroupAuditLog(
        code: String,
        limit: Int = 30,
        beforeId: Long? = null
    ): List<ReadingGroupAuditEntry> {
        authenticatedUserOrNull()
            ?: error("Je sessie is verlopen. Log opnieuw in om het activiteitenlogboek te bekijken.")
        return groupRepository.loadAuditLog(code, limit, beforeId)
    }

    suspend fun recordGroupProgress(
        code: String,
        unit: String,
        amount: Int,
        source: String = "manual",
        shareToFeed: Boolean = false,
        feedMessage: String? = null
    ) {
        val safeAmount = amount.coerceIn(1, 10_000)
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om voortgang te delen.")
        val displayName = currentDisplayName(user.email)
        groupRepository.recordProgress(
            code = code,
            unit = unit,
            amount = safeAmount,
            source = source,
            shareToFeed = shareToFeed,
            feedMessage = feedMessage?.takeIf(String::isNotBlank)
                ?: "Heeft $safeAmount ${groupUnitLabel(unit, safeAmount)} gelezen.",
            displayName = displayName
        )
    }

    suspend fun sendGroupMessage(code: String, message: String): ReadingGroupFeedItem {
        val safeMessage = message.trim().take(500)
        if (safeMessage.isBlank()) error("Schrijf eerst een bericht.")
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om te chatten.")
        val displayName = currentDisplayName(user.email)
        return groupRepository.sendMessage(code, safeMessage, displayName, user.id)
    }

    suspend fun loadGroupFeed(code: String): List<ReadingGroupFeedItem> {
        return groupRepository.loadFeed(code, authenticatedUserOrNull()?.id)
    }

    suspend fun toggleGroupFeedLike(code: String, postId: String, currentlyLiked: Boolean): Boolean {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om te liken.")
        return groupRepository.toggleLike(code, postId)
    }

    suspend fun toggleGroupPostReaction(code: String, postId: String, reaction: String): String? {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om te reageren.")
        return groupRepository.toggleReaction(code, postId, reaction)
    }

    suspend fun updateGroupPost(code: String, postId: String, content: String): ReadingGroupFeedItem {
        val safeContent = content.trim().take(10_000)
        if (safeContent.isBlank()) error("Een bericht mag niet leeg zijn.")
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om het bericht te bewerken.")
        return groupRepository.updatePost(code, postId, safeContent, user.id)
    }

    suspend fun setGroupPostPinned(code: String, postId: String, pinned: Boolean): ReadingGroupFeedItem {
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om berichten vast te zetten.")
        return groupRepository.setPostPinned(code, postId, pinned, user.id)
    }

    suspend fun deleteGroupPost(code: String, postId: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om het bericht te verwijderen.")
        groupRepository.deletePost(code, postId)
    }

    suspend fun reportGroupPost(code: String, postId: String, reason: String, details: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om het bericht te rapporteren.")
        groupRepository.reportPost(code, postId, reason, details.trim().take(2_000))
    }

    suspend fun deleteGroupPostComment(code: String, postId: String, commentId: String) {
        authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om de reactie te verwijderen.")
        groupRepository.deleteComment(code, postId, commentId)
    }

    suspend fun addGroupFeedComment(code: String, postId: String, content: String): ReadingGroupCommentItem {
        val safeContent = content.trim().take(400)
        if (safeContent.isBlank()) error("Schrijf eerst een reactie.")
        val user = authenticatedUserOrNull(forceRefresh = true)
            ?: error("Je sessie is verlopen. Log opnieuw in om te reageren.")
        val displayName = currentDisplayName(user.email)
        return groupRepository.addComment(code, postId, safeContent, displayName)
    }

    suspend fun loadGroupLeaderboard(code: String): List<ReadingGroupLeaderboardRow> {
        return groupRepository.loadLeaderboard(code)
    }

    suspend fun signIn(email: String, password: String) {
        client.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
        synchronizeAuthenticationState()
    }

    suspend fun signUp(email: String, password: String): Boolean {
        client.auth.signUpWith(Email) {
            this.email = email
            this.password = password
        }
        return synchronizeAuthenticationState() is AuthenticationState.Authenticated
    }

    suspend fun signInWithGoogle() {
        client.auth.signInWith(Google)
    }

    suspend fun requestPasswordReset(email: String) {
        require(AccountManagementPolicy.validEmail(email))
        client.auth.resetPasswordForEmail(email.trim(), redirectUrl = "qurantracker://auth")
    }

    private suspend fun verifyAccountPassword(password: String) {
        val before = client.auth.retrieveUserForCurrentSession()
        require(password.isNotBlank())
        client.auth.signInWith(Email) {
            email = requireNotNull(before.email)
            this.password = password
        }
        check(client.auth.currentUserOrNull()?.id == before.id) { "Account identity changed" }
    }

    suspend fun changeAccountPassword(currentPassword: String, newPassword: String, nonce: String = "") {
        require(AccountManagementPolicy.validPassword(newPassword))
        verifyAccountPassword(currentPassword)
        client.auth.updateUser {
            password = newPassword
            this.nonce = nonce.trim().ifBlank { null }
        }
    }

    suspend fun requestPasswordChangeCode() = client.auth.reauthenticate()

    suspend fun completePasswordRecovery(newPassword: String) {
        check(_passwordRecovery.value) { "No verified recovery session" }
        require(AccountManagementPolicy.validPassword(newPassword))
        client.auth.updateUser { password = newPassword }
        // Keep the recovery dialog open to show success; Done clears the flag.
    }

    fun dismissPasswordRecovery() { _passwordRecovery.value = false }

    suspend fun changeAccountEmail(currentPassword: String, newEmail: String) {
        val email = client.auth.retrieveUserForCurrentSession().email.orEmpty()
        require(AccountManagementPolicy.changedEmail(email, newEmail))
        verifyAccountPassword(currentPassword)
        client.auth.updateUser(redirectUrl = "qurantracker://auth") { this.email = newEmail.trim() }
        synchronizeAuthenticationState()
    }

    suspend fun accountDeletionStatus(): String =
        client.postgrest.rpc("account_deletion_status_v1").decodeAs<String>()

    suspend fun deleteOwnAccount(confirmationEmail: String, currentPassword: String) {
        val user = client.auth.retrieveUserForCurrentSession()
        require(AccountManagementPolicy.deletionConfirmed(user.email.orEmpty(), confirmationEmail))
        if (user.appMetadata.stringValue("provider") == "email") verifyAccountPassword(currentPassword)
        // No user ID is accepted by this RPC: the server derives it from auth.uid().
        client.postgrest.rpc("delete_my_account_v1", buildJsonObject {
            put("confirmation_email", confirmationEmail.trim())
        })
        _accountDeleted.value = true
        client.auth.clearSession()
        _authenticationState.value = AuthenticationState.SignedOut
    }

    suspend fun signOut() {
        client.auth.signOut()
        _authenticationState.value = AuthenticationState.SignedOut
    }

    fun handleDeeplinks(intent: Intent) {
        val data = intent.data
        // Auth callback URLs can contain access/refresh tokens. Never log them.
        try {
            if (data?.scheme == SupabaseConfig.DEEPLINK_SCHEME && data.host == SupabaseConfig.DEEPLINK_HOST) {
                // The SDK's sessionStatus is the source of truth. An invalid callback must
                // not leave the UI in Checking when the SDK emits no session change.
                clientOrNull?.handleDeeplinks(intent)
            }
        } catch (e: Exception) {
            android.util.Log.e("SupabaseAuth", "Auth callback could not be processed")
        }
    }
}

private fun groupUnitLabel(unit: String, amount: Int): String = when (unit) {
    "ayah" -> if (amount == 1) "ayah" else "ayat"
    "page" -> if (amount == 1) "pagina" else "pagina's"
    "hizb" -> "hizb"
    else -> unit
}

private fun JsonObject?.stringValue(key: String): String? =
    this?.get(key)?.jsonPrimitive?.contentOrNull
