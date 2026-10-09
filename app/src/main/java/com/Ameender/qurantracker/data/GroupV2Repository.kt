package com.Ameender.qurantracker.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.rpc
import io.github.jan.supabase.postgrest.result.PostgrestResult
import io.github.jan.supabase.storage.storage
import io.ktor.http.ContentType
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlin.time.Duration.Companion.hours

@Serializable
private data class GroupV2Row(
    val id: String,
    val code: String,
    val name: String,
    val description: String = "",
    @SerialName("goal_type") val goalType: String = "free_reading",
    @SerialName("progress_unit") val progressUnit: String = "page",
    @SerialName("goal_period") val goalPeriod: String = "none",
    @SerialName("goal_target") val goalTarget: Int? = null,
    val privacy: String = "restricted",
    @SerialName("language_code") val languageCode: String = "nl",
    @SerialName("owner_id") val ownerId: String,
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("viewer_role") val viewerRole: String? = null,
    @SerialName("member_count") val memberCount: Long = 0,
    val permissions: List<String> = emptyList(),
    @SerialName("join_request_status") val joinRequestStatus: String? = null,
    @SerialName("unread_notification_count") val unreadNotificationCount: Long = 0,
    @SerialName("active_rules_version") val activeRulesVersion: Int? = null
)

@Serializable
private data class GroupLogoRow(@SerialName("logo_path") val path: String? = null)
@Serializable
private data class SetGroupLogoParams(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_logo_path") val path: String?
)

@Serializable
private data class GroupV2MembershipRow(
    val id: String,
    @SerialName("group_id") val groupId: String,
    @SerialName("user_id") val userId: String,
    @SerialName("role_id") val roleId: String,
    val status: String = "active",
    @SerialName("display_name_snapshot") val displayNameSnapshot: String? = null,
    @SerialName("joined_at") val joinedAt: String = ""
)

@Serializable
private data class GroupV2RoleRow(
    val id: String,
    val key: String
)

@Serializable
private data class GroupV2MemberListRow(
    @SerialName("group_code") val groupCode: String,
    @SerialName("user_id") val userId: String,
    @SerialName("display_name") val displayName: String,
    val role: String,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("joined_at") val joinedAt: String = ""
)

@Serializable
private data class GroupV2RoleListRow(
    val key: String,
    val name: String,
    val rank: Int
)

@Serializable
private data class GroupV2InvitationRow(
    val id: String,
    val token: String? = null,
    @SerialName("invited_email") val invitedEmail: String? = null,
    val status: String,
    @SerialName("max_uses") val maxUses: Int,
    @SerialName("use_count") val useCount: Int,
    @SerialName("expires_at") val expiresAt: String,
    @SerialName("created_at") val createdAt: String
)

@Serializable
private data class GroupV2JoinRequestRow(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("display_name") val displayName: String = "",
    @SerialName("avatar_url") val avatarUrl: String? = null,
    val message: String = "",
    val status: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("reviewed_at") val reviewedAt: String? = null
)

@Serializable
private data class GroupV2MediaRow(
    val id: String,
    @SerialName("attachment_id") val attachmentId: String,
    @SerialName("source_post_id") val sourcePostId: String? = null,
    @SerialName("storage_path") val storagePath: String,
    @SerialName("mime_type") val mimeType: String,
    @SerialName("file_name") val fileName: String,
    @SerialName("byte_size") val byteSize: Long,
    val width: Int? = null,
    val height: Int? = null,
    @SerialName("created_by") val createdBy: String,
    @SerialName("display_name") val displayName: String = "",
    @SerialName("avatar_url") val avatarUrl: String? = null,
    val caption: String = "",
    @SerialName("created_at") val createdAt: String,
    @SerialName("can_delete") val canDelete: Boolean = false
)

@Serializable
private data class GroupV2TaskRow(
    val id: String,
    val title: String,
    val description: String = "",
    @SerialName("task_type") val taskType: String = "challenge",
    @SerialName("target_value") val targetValue: Int,
    @SerialName("target_unit") val targetUnit: String,
    @SerialName("starts_at") val startsAt: String? = null,
    @SerialName("due_at") val dueAt: String? = null,
    val status: String,
    @SerialName("created_by") val createdBy: String,
    @SerialName("display_name") val displayName: String = "",
    @SerialName("created_at") val createdAt: String,
    @SerialName("participant_count") val participantCount: Long = 0,
    @SerialName("completed_count") val completedCount: Long = 0,
    @SerialName("my_progress") val myProgress: Int = 0,
    @SerialName("my_completed") val myCompleted: Boolean = false,
    @SerialName("points_reward") val pointsReward: Int = 0,
    @SerialName("my_points_awarded") val myPointsAwarded: Boolean = false,
    @SerialName("can_manage") val canManage: Boolean = false
)

@Serializable
private data class GroupV3ProfileRow(
    @SerialName("user_id") val userId: String,
    @SerialName("display_name") val displayName: String,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("custom_display_name") val customDisplayName: String? = null,
    @SerialName("custom_avatar_url") val customAvatarUrl: String? = null
)

@Serializable
private data class GroupV3TaskProgressRow(
    val progress: Int,
    @SerialName("completed_at") val completedAt: String? = null,
    @SerialName("is_completed") val isCompleted: Boolean = false,
    @SerialName("awarded_points") val awardedPoints: Int = 0
)

@Serializable
private data class GroupV3PointTotalRow(
    @SerialName("user_id") val userId: String,
    @SerialName("total_points") val totalPoints: Long = 0,
    @SerialName("weekly_points") val weeklyPoints: Long = 0,
    @SerialName("monthly_points") val monthlyPoints: Long = 0
)

@Serializable
private data class GroupV2EventRow(
    val id: String,
    val title: String,
    val description: String = "",
    @SerialName("starts_at") val startsAt: String,
    @SerialName("ends_at") val endsAt: String? = null,
    val timezone: String = "Europe/Amsterdam",
    val location: String? = null,
    val status: String,
    @SerialName("created_by") val createdBy: String,
    @SerialName("display_name") val displayName: String = "",
    @SerialName("created_at") val createdAt: String,
    @SerialName("going_count") val goingCount: Long = 0,
    @SerialName("maybe_count") val maybeCount: Long = 0,
    @SerialName("declined_count") val declinedCount: Long = 0,
    @SerialName("my_response") val myResponse: String? = null,
    @SerialName("can_manage") val canManage: Boolean = false
)

@Serializable
private data class GroupV2RuleRow(
    val id: String,
    val version: Int,
    val content: String,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("created_by") val createdBy: String,
    @SerialName("display_name") val displayName: String = ""
)

@Serializable
private data class GroupV2NotificationPreferencesRow(
    val level: String = "all",
    @SerialName("push_enabled") val pushEnabled: Boolean = true,
    @SerialName("muted_until") val mutedUntil: String? = null,
    @SerialName("updated_at") val updatedAt: String = ""
)

@Serializable
private data class GroupV2NotificationRow(
    val id: String,
    val type: String,
    val title: String,
    val body: String = "",
    @SerialName("entity_type") val entityType: String? = null,
    @SerialName("entity_id") val entityId: String? = null,
    @SerialName("read_at") val readAt: String? = null,
    @SerialName("created_at") val createdAt: String
)

@Serializable
private data class GroupV2ModerationReportRow(
    val id: String,
    @SerialName("reporter_id") val reporterId: String,
    @SerialName("reporter_name") val reporterName: String = "",
    @SerialName("target_type") val targetType: String,
    @SerialName("target_id") val targetId: String? = null,
    val reason: String,
    val details: String = "",
    val status: String,
    @SerialName("assigned_to") val assignedTo: String? = null,
    @SerialName("resolved_by") val resolvedBy: String? = null,
    @SerialName("resolved_at") val resolvedAt: String? = null,
    @SerialName("resolution_note") val resolutionNote: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String
)

@Serializable
private data class GroupV2AuditEntryRow(
    val id: Long,
    @SerialName("actor_id") val actorId: String? = null,
    @SerialName("actor_name") val actorName: String = "",
    val action: String,
    @SerialName("target_type") val targetType: String? = null,
    @SerialName("target_id") val targetId: String? = null,
    val metadata: JsonObject,
    @SerialName("created_at") val createdAt: String
)

@Serializable
private data class GroupV2PostRow(
    val id: String,
    @SerialName("group_id") val groupId: String,
    @SerialName("created_by") val createdBy: String,
    val type: String,
    val content: String = "",
    @SerialName("display_name_snapshot") val displayNameSnapshot: String? = null,
    @SerialName("progress_unit") val progressUnit: String? = null,
    @SerialName("progress_amount") val progressAmount: Int? = null,
    @SerialName("legacy_id") val legacyId: Long? = null,
    @SerialName("created_at") val createdAt: String = "",
    @SerialName("pinned_at") val pinnedAt: String? = null,
    @SerialName("edited_at") val editedAt: String? = null
)

@Serializable
private data class GroupV2ReactionRow(
    val id: String,
    @SerialName("post_id") val postId: String,
    @SerialName("user_id") val userId: String,
    val reaction: String = "like"
)

@Serializable
private data class GroupV2CommentRow(
    val id: String,
    @SerialName("post_id") val postId: String,
    @SerialName("created_by") val createdBy: String,
    val content: String,
    @SerialName("display_name_snapshot") val displayNameSnapshot: String? = null,
    @SerialName("legacy_id") val legacyId: Long? = null,
    @SerialName("created_at") val createdAt: String = ""
)

@Serializable
private data class GroupV2ProgressRow(
    @SerialName("user_id") val userId: String,
    val unit: String,
    val amount: Int,
    val source: String = "",
    @SerialName("occurred_on") val occurredOn: String = ""
)

@Serializable
private data class CreateGroupV2Params(
    @SerialName("p_code") val code: String,
    @SerialName("p_name") val name: String,
    @SerialName("p_description") val description: String,
    @SerialName("p_goal_type") val goalType: String,
    @SerialName("p_progress_unit") val progressUnit: String,
    @SerialName("p_goal_period") val goalPeriod: String,
    @SerialName("p_goal_target") val goalTarget: Int?,
    @SerialName("p_privacy") val privacy: String,
    @SerialName("p_member_permissions") val memberPermissions: GroupMemberPermissions
)

@Serializable
private data class UpdateGroupV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_name") val name: String,
    @SerialName("p_description") val description: String,
    @SerialName("p_goal_type") val goalType: String,
    @SerialName("p_progress_unit") val progressUnit: String,
    @SerialName("p_goal_period") val goalPeriod: String,
    @SerialName("p_goal_target") val goalTarget: Int?,
    @SerialName("p_privacy") val privacy: String,
    @SerialName("p_member_permissions") val memberPermissions: GroupMemberPermissions
)

@Serializable
private data class JoinGroupV2Params(
    @SerialName("p_code") val code: String,
    @SerialName("p_display_name") val displayName: String?
)

@Serializable
private data class GroupIdParam(
    @SerialName("p_group_id") val groupId: String
)

@Serializable
private data class GetGroupDetailV3Params(
    @SerialName("p_code") val code: String
)

@Serializable
private data class CreateTextPostV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_content") val content: String,
    @SerialName("p_display_name") val displayName: String?
)

@Serializable
private data class RecordProgressV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_unit") val unit: String,
    @SerialName("p_amount") val amount: Int,
    @SerialName("p_source") val source: String,
    @SerialName("p_share_to_feed") val shareToFeed: Boolean,
    @SerialName("p_feed_message") val feedMessage: String?,
    @SerialName("p_display_name") val displayName: String?
)

@Serializable
private data class TogglePostLikeV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_post_id") val postId: String
)

@Serializable
private data class AddPostCommentV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_post_id") val postId: String,
    @SerialName("p_content") val content: String,
    @SerialName("p_display_name") val displayName: String?
)

@Serializable
private data class UpdatePostV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_post_id") val postId: String,
    @SerialName("p_content") val content: String
)

@Serializable
private data class SetPostPinnedV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_post_id") val postId: String,
    @SerialName("p_pinned") val pinned: Boolean
)

@Serializable
private data class PostMutationV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_post_id") val postId: String
)

@Serializable
private data class TogglePostReactionV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_post_id") val postId: String,
    @SerialName("p_reaction") val reaction: String
)

@Serializable
private data class DeletePostCommentV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_post_id") val postId: String,
    @SerialName("p_comment_id") val commentId: String
)

@Serializable
private data class ReportPostV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_post_id") val postId: String,
    @SerialName("p_reason") val reason: String,
    @SerialName("p_details") val details: String
)

@Serializable
private data class SetMemberRoleV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_user_id") val userId: String,
    @SerialName("p_role_key") val roleKey: String
)

@Serializable
private data class RemoveMemberV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_user_id") val userId: String,
    @SerialName("p_block") val block: Boolean
)

@Serializable
private data class CreateInvitationV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_invited_email") val invitedEmail: String?,
    @SerialName("p_expires_days") val expiresDays: Int,
    @SerialName("p_max_uses") val maxUses: Int
)

@Serializable
private data class InvitationMutationV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_invitation_id") val invitationId: String
)

@Serializable
private data class AcceptInvitationV2Params(
    @SerialName("p_token") val token: String,
    @SerialName("p_display_name") val displayName: String?
)

@Serializable
private data class CreateJoinRequestV2Params(
    @SerialName("p_code") val code: String,
    @SerialName("p_message") val message: String
)

@Serializable
private data class ReviewJoinRequestV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_request_id") val requestId: String,
    @SerialName("p_approve") val approve: Boolean
)

@Serializable
private data class ListGroupMediaV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_limit") val limit: Int,
    @SerialName("p_before") val before: String? = null
)

@Serializable
private data class RegisterGroupMediaV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_storage_path") val storagePath: String,
    @SerialName("p_mime_type") val mimeType: String,
    @SerialName("p_file_name") val fileName: String,
    @SerialName("p_byte_size") val byteSize: Long,
    @SerialName("p_caption") val caption: String,
    @SerialName("p_width") val width: Int? = null,
    @SerialName("p_height") val height: Int? = null
)

@Serializable
private data class DeleteGroupMediaV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_media_id") val mediaId: String
)

@Serializable
private data class ListGroupTasksV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_limit") val limit: Int = 50
)

@Serializable
private data class CreateGroupTaskV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_title") val title: String,
    @SerialName("p_description") val description: String,
    @SerialName("p_task_type") val taskType: String,
    @SerialName("p_target_value") val targetValue: Int,
    @SerialName("p_target_unit") val targetUnit: String,
    @SerialName("p_duration_days") val durationDays: Int?,
    @SerialName("p_points_reward") val pointsReward: Int
)

@Serializable
private data class SetGroupTaskProgressV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_task_id") val taskId: String,
    @SerialName("p_progress") val progress: Int
)

@Serializable
private data class SetGroupTaskStatusV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_task_id") val taskId: String,
    @SerialName("p_status") val status: String
)

@Serializable
private data class UpdateGroupProfileV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_display_name") val displayName: String?,
    @SerialName("p_avatar_url") val avatarUrl: String?
)

@Serializable
private data class CreateGroupEventV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_title") val title: String,
    @SerialName("p_description") val description: String,
    @SerialName("p_starts_at") val startsAt: String,
    @SerialName("p_ends_at") val endsAt: String?,
    @SerialName("p_timezone") val timezone: String,
    @SerialName("p_location") val location: String?
)

@Serializable
private data class RespondGroupEventV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_event_id") val eventId: String,
    @SerialName("p_response") val response: String
)

@Serializable
private data class SetGroupEventStatusV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_event_id") val eventId: String,
    @SerialName("p_status") val status: String
)

@Serializable
private data class PublishGroupRulesV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_content") val content: String
)

@Serializable
private data class UpdateGroupNotificationPreferencesV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_level") val level: String,
    @SerialName("p_push_enabled") val pushEnabled: Boolean,
    @SerialName("p_muted_until") val mutedUntil: String? = null
)

@Serializable
private data class ListGroupNotificationsV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_limit") val limit: Int,
    @SerialName("p_before_created_at") val beforeCreatedAt: String? = null,
    @SerialName("p_before_id") val beforeId: String? = null
)

@Serializable
private data class MarkGroupNotificationReadV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_notification_id") val notificationId: String? = null,
    @SerialName("p_read") val read: Boolean = true
)

@Serializable
private data class SendGroupNotificationV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_title") val title: String,
    @SerialName("p_body") val body: String,
    @SerialName("p_type") val type: String,
    @SerialName("p_entity_type") val entityType: String? = null,
    @SerialName("p_entity_id") val entityId: String? = null
)

@Serializable
private data class ListGroupModerationReportsV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_status") val status: String? = null,
    @SerialName("p_limit") val limit: Int,
    @SerialName("p_before_created_at") val beforeCreatedAt: String? = null,
    @SerialName("p_before_id") val beforeId: String? = null
)

@Serializable
private data class ReviewGroupModerationReportV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_report_id") val reportId: String,
    @SerialName("p_status") val status: String,
    @SerialName("p_resolution_note") val resolutionNote: String? = null
)

@Serializable
private data class ListGroupAuditLogV2Params(
    @SerialName("p_group_id") val groupId: String,
    @SerialName("p_limit") val limit: Int,
    @SerialName("p_before_id") val beforeId: Long? = null
)

internal class GroupV2Repository(
    private val client: SupabaseClient
) {
    suspend fun createGroup(
        currentUserId: String,
        name: String,
        description: String,
        goalType: String,
        progressUnit: String,
        goalPeriod: String,
        goalTarget: Int?,
        privacy: String,
        code: String,
        memberPermissions: GroupMemberPermissions
    ): ReadingGroupDetails {
        val row = client.postgrest.rpc(
            "create_group_v3_full",
            CreateGroupV2Params(
                code = code.trim().uppercase(),
                name = name.trim(),
                description = description.trim(),
                goalType = goalType,
                progressUnit = progressUnit,
                goalPeriod = goalPeriod,
                goalTarget = goalTarget,
                privacy = privacy,
                memberPermissions = memberPermissions
            )
        ).decodeSingleFlexible<GroupV2Row>()
        return loadGroup(row.code, currentUserId)
    }

    suspend fun joinGroup(
        currentUserId: String,
        code: String,
        displayName: String
    ): ReadingGroupDetails {
        val row = client.postgrest.rpc(
            "join_group_v2_by_code",
            JoinGroupV2Params(code.trim().uppercase(), displayName)
        ).decodeSingleFlexible<GroupV2Row>()
        return loadGroup(row.code, currentUserId)
    }

    suspend fun loadGroup(code: String, currentUserId: String): ReadingGroupDetails {
        val row = loadGroupRowByCode(code)
        val memberPermissions = client.postgrest.rpc(
            "get_group_member_permissions_v1", GroupIdParam(row.id)
        ).decodeAs<GroupMemberPermissions>()
        return row.toDetails(currentUserId, row.viewerRole ?: loadCurrentRole(row.id, currentUserId))
            .copy(memberPermissions = memberPermissions)
    }

    suspend fun loadCurrentUserGroups(currentUserId: String): List<ReadingGroupDetails> {
        return client.postgrest.rpc("list_my_groups_v2")
            .decodeList<GroupV2Row>()
            .map { group ->
                group.toDetails(currentUserId, group.viewerRole ?: "member")
            }
            .distinctBy { it.code }
            .sortedWith(
                compareByDescending<ReadingGroupDetails> { it.createdAt }
                    .thenBy { it.name.lowercase() }
            )
    }

    suspend fun updateGroup(
        currentUserId: String,
        code: String,
        name: String,
        description: String,
        goalType: String,
        progressUnit: String,
        goalPeriod: String,
        goalTarget: Int?,
        privacy: String,
        memberPermissions: GroupMemberPermissions
    ): ReadingGroupDetails {
        val existing = loadGroupRowByCode(code)
        val updated = client.postgrest.rpc(
            "update_group_v3_full",
            UpdateGroupV2Params(
                groupId = existing.id,
                name = name.trim(),
                description = description.trim(),
                goalType = goalType,
                progressUnit = progressUnit,
                goalPeriod = goalPeriod,
                goalTarget = goalTarget,
                privacy = privacy,
                memberPermissions = memberPermissions
            )
        ).decodeSingleFlexible<GroupV2Row>()
        return loadGroup(updated.code, currentUserId)
    }

    suspend fun deleteGroup(code: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc("soft_delete_group_v2", GroupIdParam(group.id))
    }

    suspend fun loadMembers(code: String, currentUserId: String? = null): List<ReadingGroupMemberRow> {
        val group = loadGroupRowByCode(code)
        val rows = client.postgrest.rpc(
            "list_group_members_v3",
            GroupIdParam(group.id)
        ).decodeList<GroupV2MemberListRow>()
        return rows.map { member ->
            ReadingGroupMemberRow(
                groupCode = member.groupCode,
                userId = member.userId,
                displayName = member.displayName,
                role = member.role,
                avatarUrl = member.avatarUrl,
                joinedAt = member.joinedAt,
                isCurrentUser = currentUserId != null && member.userId == currentUserId
            )
        }.sortedWith(
            compareByDescending<ReadingGroupMemberRow> { it.role == "owner" }
                .thenByDescending { it.role == "admin" }
                .thenBy { it.displayName.lowercase() }
        )
    }

    suspend fun loadMyGroupProfile(code: String): ReadingGroupProfile {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "get_my_group_profile_v2",
            GroupIdParam(group.id)
        ).decodeSingleFlexible<GroupV3ProfileRow>().toGroupProfile()
    }

    suspend fun updateMyGroupProfile(
        code: String,
        displayName: String?,
        avatarUrl: String?
    ): ReadingGroupProfile {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "update_my_group_profile_v2",
            UpdateGroupProfileV2Params(
                groupId = group.id,
                displayName = displayName?.trim()?.takeIf(String::isNotBlank),
                avatarUrl = avatarUrl?.trim()?.takeIf(String::isNotBlank)
            )
        ).decodeSingleFlexible<GroupV3ProfileRow>().toGroupProfile()
    }

    suspend fun uploadGroupProfileAvatar(
        code: String,
        currentUserId: String,
        bytes: ByteArray,
        mimeType: String
    ): String {
        val group = loadGroupRowByCode(code)
        val safeMimeType = mimeType.trim().lowercase()
        val extension = when (safeMimeType) {
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/jpeg" -> "jpg"
            else -> error("Kies een JPG-, PNG- of WebP-afbeelding.")
        }
        val path = "${currentUserId.lowercase()}/groups/${group.id.lowercase()}/avatar.$extension"
        val bucket = client.storage.from(PROFILE_AVATAR_BUCKET)
        bucket.upload(path, bytes) {
            upsert = true
            contentType = ContentType.parse(safeMimeType)
        }
        return "${bucket.publicUrl(path)}?v=${System.currentTimeMillis()}"
    }

    suspend fun loadGroupLogo(code: String): String? {
        val path = client.postgrest.rpc("get_group_logo_v1", GetGroupDetailV3Params(code.trim().uppercase()))
            .decodeSingleFlexible<GroupLogoRow>().path ?: return null
        return client.storage.from("group-logos").createSignedUrl(path, 1.hours)
    }

    suspend fun setGroupLogo(code: String, bytes: ByteArray?, mimeType: String = "image/jpeg") {
        val group = loadGroupRowByCode(code)
        check("group.update" in group.permissions) { "Je hebt geen rechten om het groepslogo te wijzigen." }
        val path = bytes?.let {
            require(it.isNotEmpty() && it.size <= 5 * 1024 * 1024) { "Kies een afbeelding van maximaal 5 MB." }
            val extension = when(mimeType) {
                "image/jpeg" -> "jpg"
                "image/png" -> "png"
                "image/webp" -> "webp"
                else -> error("Kies een JPG-, PNG- of WebP-afbeelding.")
            }
            "${group.id}/${UUID.randomUUID()}.$extension".also { key ->
                client.storage.from("group-logos").upload(key, it) { contentType = ContentType.parse(mimeType) }
            }
        }
        client.postgrest.rpc("set_group_logo_v1", SetGroupLogoParams(group.id, path))
    }

    suspend fun loadRoles(code: String): List<ReadingGroupRoleRow> {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "list_group_roles_v2",
            GroupIdParam(group.id)
        ).decodeList<GroupV2RoleListRow>().map {
            ReadingGroupRoleRow(key = it.key, name = it.name, rank = it.rank)
        }
    }

    suspend fun setMemberRole(code: String, userId: String, roleKey: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "set_group_member_role_v2",
            SetMemberRoleV2Params(group.id, userId, roleKey)
        )
    }

    suspend fun removeMember(code: String, userId: String, block: Boolean) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "remove_group_member_v2",
            RemoveMemberV2Params(group.id, userId, block)
        )
    }

    suspend fun createInvitation(
        code: String,
        invitedEmail: String?,
        expiresDays: Int,
        maxUses: Int
    ): ReadingGroupInvitationRow {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "create_group_invitation_v2",
            CreateInvitationV2Params(group.id, invitedEmail, expiresDays, maxUses)
        ).decodeSingleFlexible<GroupV2InvitationRow>().toInvitation()
    }

    suspend fun loadInvitations(code: String): List<ReadingGroupInvitationRow> {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "list_group_invitations_v2",
            GroupIdParam(group.id)
        ).decodeList<GroupV2InvitationRow>().map(GroupV2InvitationRow::toInvitation)
    }

    suspend fun revokeInvitation(code: String, invitationId: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "revoke_group_invitation_v2",
            InvitationMutationV2Params(group.id, invitationId)
        )
    }

    suspend fun acceptInvitation(
        currentUserId: String,
        token: String,
        displayName: String
    ): ReadingGroupDetails {
        val group = client.postgrest.rpc(
            "accept_group_invitation_v2",
            AcceptInvitationV2Params(token, displayName)
        ).decodeSingleFlexible<GroupV2Row>()
        return group.toDetails(currentUserId, "member")
    }

    suspend fun createJoinRequest(code: String, message: String) {
        client.postgrest.rpc(
            "create_group_join_request_v2",
            CreateJoinRequestV2Params(code.trim().uppercase(), message)
        )
    }

    suspend fun loadJoinRequests(code: String): List<ReadingGroupJoinRequestRow> {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "list_group_join_requests_v2",
            GroupIdParam(group.id)
        ).decodeList<GroupV2JoinRequestRow>().map(GroupV2JoinRequestRow::toJoinRequest)
    }

    suspend fun reviewJoinRequest(code: String, requestId: String, approve: Boolean) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "review_group_join_request_v2",
            ReviewJoinRequestV2Params(group.id, requestId, approve)
        )
    }

    suspend fun loadMedia(code: String, currentUserId: String): List<ReadingGroupMediaItem> {
        val group = loadGroupRowByCode(code)
        return loadMediaForGroup(group.id, currentUserId)
    }

    suspend fun uploadMedia(
        code: String,
        currentUserId: String,
        bytes: ByteArray,
        mimeType: String,
        fileName: String,
        caption: String
    ): ReadingGroupMediaItem {
        val group = loadGroupRowByCode(code)
        val safeMimeType = mimeType.trim().lowercase()
        val extension = when (safeMimeType) {
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/gif" -> "gif"
            "image/heic" -> "heic"
            "image/heif" -> "heif"
            "image/jpeg" -> "jpg"
            else -> error("Dit afbeeldingstype wordt niet ondersteund.")
        }
        val safeFileName = fileName
            .trim()
            .replace(Regex("[/\\\\]"), "_")
            .take(255)
            .ifBlank { "groepsfoto.$extension" }
        val storagePath = "${group.id.lowercase()}/${currentUserId.lowercase()}/${UUID.randomUUID()}.$extension"
        val bucket = client.storage.from(GROUP_MEDIA_BUCKET)
        bucket.upload(storagePath, bytes) {
            upsert = false
            contentType = ContentType.parse(safeMimeType)
        }
        return try {
            val row = client.postgrest.rpc(
                "register_group_media_v2",
                RegisterGroupMediaV2Params(
                    groupId = group.id,
                    storagePath = storagePath,
                    mimeType = safeMimeType,
                    fileName = safeFileName,
                    byteSize = bytes.size.toLong(),
                    caption = caption
                )
            ).decodeSingleFlexible<GroupV2MediaRow>()
            row.toMediaItem(
                signedUrl = bucket.createSignedUrl(storagePath, GROUP_MEDIA_URL_TTL),
                currentUserId = currentUserId
            )
        } catch (error: Throwable) {
            runCatching { bucket.delete(storagePath) }
            throw error
        }
    }

    suspend fun deleteMedia(code: String, mediaId: String) {
        val group = loadGroupRowByCode(code)
        val storagePath: String = client.postgrest.rpc(
            "delete_group_media_v2",
            DeleteGroupMediaV2Params(group.id, mediaId)
        ).decodeAs()
        if (storagePath.isNotBlank()) {
            runCatching { client.storage.from(GROUP_MEDIA_BUCKET).delete(storagePath) }
        }
    }

    suspend fun loadTasks(code: String): List<ReadingGroupTaskItem> {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "list_group_tasks_v3",
            ListGroupTasksV2Params(group.id)
        ).decodeList<GroupV2TaskRow>().map(GroupV2TaskRow::toTaskItem)
    }

    suspend fun createTask(
        code: String,
        title: String,
        description: String,
        taskType: String,
        targetValue: Int,
        targetUnit: String,
        durationDays: Int?,
        pointsReward: Int
    ) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "create_group_task_v3",
            CreateGroupTaskV2Params(
                groupId = group.id,
                title = title.trim(),
                description = description.trim(),
                taskType = taskType,
                targetValue = targetValue,
                targetUnit = targetUnit,
                durationDays = durationDays,
                pointsReward = pointsReward.coerceIn(0, 1_000)
            )
        )
    }

    suspend fun setTaskProgress(code: String, taskId: String, progress: Int): Int {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "set_group_task_progress_v3",
            SetGroupTaskProgressV2Params(group.id, taskId, progress)
        ).decodeSingleFlexible<GroupV3TaskProgressRow>().awardedPoints
    }

    suspend fun setTaskStatus(code: String, taskId: String, status: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "set_group_task_status_v2",
            SetGroupTaskStatusV2Params(group.id, taskId, status)
        )
    }

    suspend fun loadEvents(code: String): List<ReadingGroupEventItem> {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "list_group_events_v2",
            ListGroupTasksV2Params(group.id)
        ).decodeList<GroupV2EventRow>().map(GroupV2EventRow::toEventItem)
    }

    suspend fun createEvent(
        code: String,
        title: String,
        description: String,
        startsAt: String,
        endsAt: String?,
        timezone: String,
        location: String
    ) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "create_group_event_v2",
            CreateGroupEventV2Params(
                groupId = group.id,
                title = title.trim(),
                description = description.trim(),
                startsAt = startsAt,
                endsAt = endsAt,
                timezone = timezone,
                location = location.trim().takeIf(String::isNotBlank)
            )
        )
    }

    suspend fun respondToEvent(code: String, eventId: String, response: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "respond_group_event_v2",
            RespondGroupEventV2Params(group.id, eventId, response)
        )
    }

    suspend fun setEventStatus(code: String, eventId: String, status: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "set_group_event_status_v2",
            SetGroupEventStatusV2Params(group.id, eventId, status)
        )
    }

    suspend fun loadRules(code: String): ReadingGroupRule? {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "get_group_rules_v2",
            GroupIdParam(group.id)
        ).decodeList<GroupV2RuleRow>().firstOrNull()?.toRule()
    }

    suspend fun publishRules(code: String, content: String): ReadingGroupRule {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "publish_group_rules_v2",
            PublishGroupRulesV2Params(group.id, content.trim())
        ).decodeSingleFlexible<GroupV2RuleRow>().toRule()
    }

    suspend fun loadNotificationPreferences(code: String): ReadingGroupNotificationPreferences {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "get_group_notification_preferences_v2",
            GroupIdParam(group.id)
        ).decodeSingleFlexible<GroupV2NotificationPreferencesRow>().toNotificationPreferences()
    }

    suspend fun updateNotificationPreferences(
        code: String,
        level: String,
        pushEnabled: Boolean,
        mutedUntil: String?
    ): ReadingGroupNotificationPreferences {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "update_group_notification_preferences_v2",
            UpdateGroupNotificationPreferencesV2Params(group.id, level, pushEnabled, mutedUntil)
        ).decodeSingleFlexible<GroupV2NotificationPreferencesRow>().toNotificationPreferences()
    }

    suspend fun loadNotifications(
        code: String,
        limit: Int = 30,
        beforeCreatedAt: String? = null,
        beforeId: String? = null
    ): List<ReadingGroupNotification> {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "list_group_notifications_v2",
            ListGroupNotificationsV2Params(
                groupId = group.id,
                limit = limit.coerceIn(1, 100),
                beforeCreatedAt = beforeCreatedAt,
                beforeId = beforeId
            )
        ).decodeList<GroupV2NotificationRow>().map(GroupV2NotificationRow::toNotification)
    }

    suspend fun markNotificationRead(
        code: String,
        notificationId: String?,
        read: Boolean
    ): Int {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "mark_group_notification_read_v2",
            MarkGroupNotificationReadV2Params(group.id, notificationId, read)
        ).decodeAs()
    }

    suspend fun sendNotification(
        code: String,
        title: String,
        body: String,
        type: String,
        entityType: String?,
        entityId: String?
    ): Int {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "send_group_notification_v2",
            SendGroupNotificationV2Params(
                groupId = group.id,
                title = title.trim(),
                body = body.trim(),
                type = type,
                entityType = entityType,
                entityId = entityId
            )
        ).decodeAs()
    }

    suspend fun loadModerationReports(
        code: String,
        status: String? = null,
        limit: Int = 30,
        beforeCreatedAt: String? = null,
        beforeId: String? = null
    ): List<ReadingGroupModerationReport> {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "list_group_moderation_reports_v2",
            ListGroupModerationReportsV2Params(
                groupId = group.id,
                status = status,
                limit = limit.coerceIn(1, 100),
                beforeCreatedAt = beforeCreatedAt,
                beforeId = beforeId
            )
        ).decodeList<GroupV2ModerationReportRow>().map(GroupV2ModerationReportRow::toModerationReport)
    }

    suspend fun reviewModerationReport(
        code: String,
        reportId: String,
        status: String,
        resolutionNote: String?
    ) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "review_group_moderation_report_v2",
            ReviewGroupModerationReportV2Params(group.id, reportId, status, resolutionNote)
        )
    }

    suspend fun loadAuditLog(
        code: String,
        limit: Int = 30,
        beforeId: Long? = null
    ): List<ReadingGroupAuditEntry> {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "list_group_audit_log_v2",
            ListGroupAuditLogV2Params(group.id, limit.coerceIn(1, 100), beforeId)
        ).decodeList<GroupV2AuditEntryRow>().map(GroupV2AuditEntryRow::toAuditEntry)
    }

    suspend fun recordProgress(
        code: String,
        unit: String,
        amount: Int,
        source: String,
        shareToFeed: Boolean,
        feedMessage: String?,
        displayName: String
    ) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "record_group_progress_v2",
            RecordProgressV2Params(
                groupId = group.id,
                unit = unit,
                amount = amount.coerceIn(1, 10_000),
                source = source,
                shareToFeed = shareToFeed,
                feedMessage = feedMessage,
                displayName = displayName
            )
        )
    }

    suspend fun sendMessage(
        code: String,
        message: String,
        displayName: String,
        currentUserId: String
    ): ReadingGroupFeedItem {
        val group = loadGroupRowByCode(code)
        val row = client.postgrest.rpc(
            "create_group_text_post_v2",
            CreateTextPostV2Params(group.id, message.trim(), displayName)
        ).decodeSingleFlexible<GroupV2PostRow>()
        val member = loadMembers(code, currentUserId).firstOrNull { it.userId == row.createdBy }
        return row.toFeedItem(
            isMine = row.createdBy == currentUserId,
            displayNameOverride = member?.displayName,
            avatarUrl = member?.avatarUrl
        )
    }

    suspend fun loadFeed(code: String, currentUserId: String?, postId: String? = null): List<ReadingGroupFeedItem> {
        val group = loadGroupRowByCode(code)
        val posts = client.from("group_posts")
            .select {
                filter {
                    eq("group_id", group.id)
                    eq("status", "published")
                    if (postId != null) eq("id", postId)
                }
                order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
                limit(60)
            }
            .decodeList<GroupV2PostRow>()
            .sortedByDescending { it.createdAt }
        if (posts.isEmpty()) return emptyList()

        val reactions = client.from("post_reactions")
            .select { filter { eq("group_id", group.id) } }
            .decodeList<GroupV2ReactionRow>()
            .filter { reaction -> posts.any { it.id == reaction.postId } }
        val comments = client.from("post_comments")
            .select {
                filter {
                    eq("group_id", group.id)
                    eq("status", "published")
                }
            }
            .decodeList<GroupV2CommentRow>()
            .filter { comment -> posts.any { it.id == comment.postId } }
        val reactionsByPost = reactions.groupBy { it.postId }
        val commentsByPost = comments.groupBy { it.postId }
        val mediaByPost = if (posts.any { it.type == "media" } && currentUserId != null) {
            loadMediaForGroup(group.id, currentUserId, limit = 60)
                .mapNotNull { media -> media.sourcePostId?.let { it to media } }
                .toMap()
        } else {
            emptyMap()
        }
        val membersById = loadMembers(code, currentUserId).associateBy { it.userId }

        return posts.map { post ->
            val postReactions = reactionsByPost[post.id].orEmpty()
            val postComments = commentsByPost[post.id].orEmpty()
            post.toFeedItem(
                likeCount = postReactions.count { it.reaction == "like" },
                likedByMe = currentUserId != null && postReactions.any {
                    it.userId == currentUserId && it.reaction == "like"
                },
                comments = postComments.sortedBy { it.createdAt }.map {
                    it.toCommentItem(currentUserId, membersById[it.createdBy]?.displayName)
                },
                isMine = currentUserId != null && post.createdBy == currentUserId,
                myReaction = currentUserId?.let { userId ->
                    postReactions.firstOrNull { it.userId == userId }?.reaction
                },
                reactionCounts = postReactions.groupingBy { it.reaction }.eachCount(),
                media = mediaByPost[post.id],
                displayNameOverride = membersById[post.createdBy]?.displayName,
                avatarUrl = membersById[post.createdBy]?.avatarUrl
            )
        }
    }

    suspend fun toggleLike(code: String, postId: String): Boolean {
        val group = loadGroupRowByCode(code)
        return client.postgrest.rpc(
            "toggle_group_post_like_v2",
            TogglePostLikeV2Params(group.id, postId)
        ).decodeAs()
    }

    suspend fun addComment(
        code: String,
        postId: String,
        content: String
    ): ReadingGroupCommentItem {
        val group = loadGroupRowByCode(code)
        val profile = loadMyGroupProfile(code)
        val row = client.postgrest.rpc(
            "add_group_post_comment_v2",
            AddPostCommentV2Params(group.id, postId, content.trim(), profile.displayName)
        ).decodeSingleFlexible<GroupV2CommentRow>()
        return row.toCommentItem(row.createdBy, profile.displayName)
    }

    suspend fun updatePost(
        code: String,
        postId: String,
        content: String,
        currentUserId: String
    ): ReadingGroupFeedItem {
        val group = loadGroupRowByCode(code)
        val row = client.postgrest.rpc(
            "update_group_post_v2",
            UpdatePostV2Params(group.id, postId, content)
        ).decodeSingleFlexible<GroupV2PostRow>()
        val member = loadMembers(code, currentUserId).firstOrNull { it.userId == row.createdBy }
        return row.toFeedItem(
            isMine = row.createdBy == currentUserId,
            displayNameOverride = member?.displayName,
            avatarUrl = member?.avatarUrl
        )
    }

    suspend fun setPostPinned(
        code: String,
        postId: String,
        pinned: Boolean,
        currentUserId: String
    ): ReadingGroupFeedItem {
        val group = loadGroupRowByCode(code)
        val row = client.postgrest.rpc(
            "set_group_post_pinned_v2",
            SetPostPinnedV2Params(group.id, postId, pinned)
        ).decodeSingleFlexible<GroupV2PostRow>()
        val member = loadMembers(code, currentUserId).firstOrNull { it.userId == row.createdBy }
        return row.toFeedItem(
            isMine = row.createdBy == currentUserId,
            displayNameOverride = member?.displayName,
            avatarUrl = member?.avatarUrl
        )
    }

    suspend fun deletePost(code: String, postId: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "delete_group_post_v2",
            PostMutationV2Params(group.id, postId)
        )
    }

    suspend fun toggleReaction(code: String, postId: String, reaction: String): String? {
        val group = loadGroupRowByCode(code)
        val selected: String = client.postgrest.rpc(
            "toggle_group_post_reaction_v2",
            TogglePostReactionV2Params(group.id, postId, reaction)
        ).decodeAs()
        return selected.takeIf(String::isNotBlank)
    }

    suspend fun deleteComment(code: String, postId: String, commentId: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "delete_group_post_comment_v2",
            DeletePostCommentV2Params(group.id, postId, commentId)
        )
    }

    suspend fun reportPost(code: String, postId: String, reason: String, details: String) {
        val group = loadGroupRowByCode(code)
        client.postgrest.rpc(
            "report_group_post_v2",
            ReportPostV2Params(group.id, postId, reason, details)
        )
    }

    suspend fun loadLeaderboard(code: String): List<ReadingGroupLeaderboardRow> {
        val group = loadGroupRowByCode(code)
        val members = loadMembers(code)
        val names = members.associate { it.userId to it.displayName }
        val avatars = members.associate { it.userId to it.avatarUrl }
        val rows = client.from("group_progress_entries")
            .select { filter { eq("group_id", group.id) } }
            .decodeList<GroupV2ProgressRow>()
        val awardTotals = client.postgrest.rpc(
            "list_group_point_totals_v2",
            GroupIdParam(group.id)
        ).decodeList<GroupV3PointTotalRow>().associateBy { it.userId }
        val rowsByUser = rows.groupBy { it.userId }
        val visibleUserIds = (members.map { it.userId } + rowsByUser.keys + awardTotals.keys).distinct()

        return visibleUserIds.map { userId ->
            val userRows = rowsByUser[userId].orEmpty()
            val awards = awardTotals[userId]
            val ayahs = userRows.filter { it.unit == "ayah" }.sumOf { it.amount }
            val manualPages = userRows.filter { it.unit == "page" }.sumOf { it.amount }
            val hizb = userRows.filter { it.unit == "hizb" }.sumOf { it.amount }
            val juz = userRows.filter { it.unit == "juz" }.sumOf { it.amount }
            val surah = userRows.filter { it.unit == "surah" }.sumOf { it.amount }
            val ayahEquivalentForRows: (List<GroupV2ProgressRow>) -> Int = { progressRows ->
                progressRows.sumOf { row ->
                    ReadingMetrics.measure(
                        unit = row.unit,
                        amount = row.amount,
                        referenceId = row.source.substringAfterLast(":").toIntOrNull()
                    ).ayahEquivalent
                }
            }
            val totalAyahEquivalent = ayahEquivalentForRows(userRows)
            val dateKeys = userRows.mapNotNull { it.occurredOn.takeIf(String::isNotBlank) }.toSet()
            val todayKey = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val weekStartKey = dateKeyDaysAgo(6)
            val monthStartKey = dateKeyDaysAgo(29)
            val readingTotalPoints = ReadingMetrics.pointsForAyahs(totalAyahEquivalent)
            val readingWeeklyPoints = ReadingMetrics.pointsForAyahs(
                ayahEquivalentForRows(userRows.filter { it.occurredOn >= weekStartKey })
            )
            val readingMonthlyPoints = ReadingMetrics.pointsForAyahs(
                ayahEquivalentForRows(userRows.filter { it.occurredOn >= monthStartKey })
            )
            val taskPoints = awards?.totalPoints?.coerceAtMost(Int.MAX_VALUE.toLong())?.toInt() ?: 0
            ReadingGroupLeaderboardRow(
                userId = userId,
                label = names[userId]?.takeIf(String::isNotBlank) ?: "Lid ${userId.take(6)}",
                avatarUrl = avatars[userId],
                totalPoints = (readingTotalPoints.toLong() + taskPoints).coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
                totalAyahEquivalent = totalAyahEquivalent,
                details = "$ayahs ayah - $manualPages pagina - $hizb hizb - $juz juz - $surah soera - $taskPoints taakpunten",
                pages = ReadingMetrics.pageEquivalent(totalAyahEquivalent),
                hizb = hizb,
                juz = juz,
                surah = surah,
                streak = progressStreak(dateKeys),
                activeToday = todayKey in dateKeys,
                weeklyPoints = (readingWeeklyPoints.toLong() + (awards?.weeklyPoints ?: 0L))
                    .coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
                monthlyPoints = (readingMonthlyPoints.toLong() + (awards?.monthlyPoints ?: 0L))
                    .coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
                readingEntries = userRows.sortedByDescending { it.occurredOn }.map {
                    ReadingGroupReadingEntry(it.unit, it.amount, it.occurredOn,
                        if (it.source.startsWith("group_manual:${it.unit}:"))
                            it.source.substringAfterLast(':').toIntOrNull() else null)
                }
            )
        }.sortedByDescending { it.totalPoints }
    }

    private suspend fun loadGroupRowByCode(code: String): GroupV2Row {
        return client.postgrest.rpc(
            "get_group_detail_v3",
            GetGroupDetailV3Params(code.trim().uppercase())
        ).decodeSingleFlexible()
    }

    private suspend fun loadGroupRowById(groupId: String): GroupV2Row {
        return client.from("groups")
            .select {
                filter {
                    eq("id", groupId)
                    eq("status", "active")
                }
                limit(1)
            }
            .decodeSingleOrNull<GroupV2Row>()
            ?: error("Deze groep bestaat niet meer.")
    }

    private suspend fun loadCurrentRole(groupId: String, userId: String): String {
        val membership = client.from("group_members")
            .select {
                filter {
                    eq("group_id", groupId)
                    eq("user_id", userId)
                    eq("status", "active")
                }
                limit(1)
            }
            .decodeSingleOrNull<GroupV2MembershipRow>()
            ?: return "member"
        return loadRoleKey(membership.roleId)
    }

    private suspend fun loadRoleKey(roleId: String): String {
        return client.from("group_roles")
            .select {
                filter { eq("id", roleId) }
                limit(1)
            }
            .decodeSingleOrNull<GroupV2RoleRow>()
            ?.key
            ?: "member"
    }

    private suspend fun loadMediaForGroup(
        groupId: String,
        currentUserId: String,
        limit: Int = 60
    ): List<ReadingGroupMediaItem> {
        val rows = client.postgrest.rpc(
            "list_group_media_v2",
            ListGroupMediaV2Params(groupId, limit.coerceIn(1, 60))
        ).decodeList<GroupV2MediaRow>()
        if (rows.isEmpty()) return emptyList()

        val signedUrls = client.storage.from(GROUP_MEDIA_BUCKET)
            .createSignedUrls(GROUP_MEDIA_URL_TTL, rows.map(GroupV2MediaRow::storagePath))
        val signedByPath = signedUrls.associate { it.path.trimStart('/') to it.signedURL }
        return rows.mapIndexed { index, row ->
            row.toMediaItem(
                signedUrl = signedByPath[row.storagePath] ?: signedUrls.getOrNull(index)?.signedURL.orEmpty(),
                currentUserId = currentUserId
            )
        }
    }

}

private const val GROUP_MEDIA_BUCKET = "group-media"
private const val PROFILE_AVATAR_BUCKET = "avatars"
private val GROUP_MEDIA_URL_TTL = 2.hours

private inline fun <reified T : Any> PostgrestResult.decodeSingleFlexible(): T {
    return runCatching { decodeSingle<T>() }.getOrElse { decodeAs() }
}

private fun GroupV2Row.toDetails(currentUserId: String, role: String): ReadingGroupDetails {
    return ReadingGroupDetails(
        code = code,
        name = name,
        description = description,
        goal = goalType,
        unit = progressUnit,
        isOwner = ownerId == currentUserId || role == "owner",
        createdAt = createdAt,
        serverId = id,
        privacy = privacy,
        goalPeriod = goalPeriod,
        goalTarget = goalTarget,
        currentRole = role,
        languageCode = languageCode,
        permissions = permissions.toSet(),
        joinRequestStatus = joinRequestStatus,
        unreadNotificationCount = unreadNotificationCount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
        activeRulesVersion = activeRulesVersion
    )
}

private fun GroupV2PostRow.toFeedItem(
    likeCount: Int = 0,
    likedByMe: Boolean = false,
    comments: List<ReadingGroupCommentItem> = emptyList(),
    isMine: Boolean = false,
    myReaction: String? = null,
    reactionCounts: Map<String, Int> = emptyMap(),
    media: ReadingGroupMediaItem? = null,
    displayNameOverride: String? = null,
    avatarUrl: String? = null
): ReadingGroupFeedItem {
    return ReadingGroupFeedItem(
        id = legacyId ?: stableUiId(id),
        displayName = resolveGroupAuthorName(displayNameOverride, displayNameSnapshot),
        type = when (type) {
            "progress" -> "progress"
            "media" -> "media"
            else -> "chat"
        },
        message = content,
        unit = progressUnit,
        amount = progressAmount,
        createdAt = createdAt,
        likeCount = likeCount,
        commentCount = comments.size,
        likedByMe = likedByMe,
        comments = comments,
        serverId = id,
        isPinned = !pinnedAt.isNullOrBlank(),
        createdBy = createdBy,
        isMine = isMine,
        myReaction = myReaction,
        reactionCounts = reactionCounts,
        editedAt = editedAt,
        avatarUrl = avatarUrl,
        mediaUrl = media?.signedUrl,
        mediaMimeType = media?.mimeType,
        mediaFileName = media?.fileName
    )
}

private fun GroupV2MediaRow.toMediaItem(
    signedUrl: String,
    currentUserId: String
): ReadingGroupMediaItem {
    return ReadingGroupMediaItem(
        id = id,
        attachmentId = attachmentId,
        sourcePostId = sourcePostId,
        storagePath = storagePath,
        signedUrl = signedUrl,
        mimeType = mimeType,
        fileName = fileName,
        byteSize = byteSize,
        width = width,
        height = height,
        createdBy = createdBy,
        displayName = displayName,
        avatarUrl = avatarUrl,
        caption = caption,
        createdAt = createdAt,
        canDelete = canDelete,
        isMine = createdBy == currentUserId
    )
}

private fun GroupV2TaskRow.toTaskItem(): ReadingGroupTaskItem {
    return ReadingGroupTaskItem(
        id = id,
        title = title,
        description = description,
        taskType = taskType,
        targetValue = targetValue,
        targetUnit = targetUnit,
        startsAt = startsAt,
        dueAt = dueAt,
        status = status,
        createdBy = createdBy,
        displayName = displayName,
        createdAt = createdAt,
        participantCount = participantCount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
        completedCount = completedCount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
        myProgress = myProgress,
        myCompleted = myCompleted,
        canManage = canManage,
        pointsReward = pointsReward,
        myPointsAwarded = myPointsAwarded
    )
}

private fun GroupV3ProfileRow.toGroupProfile(): ReadingGroupProfile = ReadingGroupProfile(
    userId = userId,
    displayName = displayName,
    avatarUrl = avatarUrl,
    customDisplayName = customDisplayName,
    customAvatarUrl = customAvatarUrl
)

private fun GroupV2EventRow.toEventItem(): ReadingGroupEventItem = ReadingGroupEventItem(
    id = id,
    title = title,
    description = description,
    startsAt = startsAt,
    endsAt = endsAt,
    timezone = timezone,
    location = location.orEmpty(),
    status = status,
    createdBy = createdBy,
    displayName = displayName,
    createdAt = createdAt,
    goingCount = goingCount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
    maybeCount = maybeCount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
    declinedCount = declinedCount.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(),
    myResponse = myResponse,
    canManage = canManage
)

private fun GroupV2RuleRow.toRule(): ReadingGroupRule = ReadingGroupRule(
    id = id,
    version = version,
    content = content,
    updatedAt = updatedAt,
    createdBy = createdBy,
    displayName = displayName
)

private fun GroupV2NotificationPreferencesRow.toNotificationPreferences() =
    ReadingGroupNotificationPreferences(
        level = level,
        pushEnabled = pushEnabled,
        mutedUntil = mutedUntil,
        updatedAt = updatedAt
    )

private fun GroupV2NotificationRow.toNotification() = ReadingGroupNotification(
    id = id,
    type = type,
    title = title,
    body = body,
    entityType = entityType,
    entityId = entityId,
    readAt = readAt,
    createdAt = createdAt
)

private fun GroupV2ModerationReportRow.toModerationReport() = ReadingGroupModerationReport(
    id = id,
    reporterId = reporterId,
    reporterName = reporterName,
    targetType = targetType,
    targetId = targetId,
    reason = reason,
    details = details,
    status = status,
    assignedTo = assignedTo,
    resolvedBy = resolvedBy,
    resolvedAt = resolvedAt,
    resolutionNote = resolutionNote,
    createdAt = createdAt,
    updatedAt = updatedAt
)

private fun GroupV2AuditEntryRow.toAuditEntry() = ReadingGroupAuditEntry(
    id = id,
    actorId = actorId,
    actorName = actorName,
    action = action,
    targetType = targetType,
    targetId = targetId,
    metadata = metadata,
    createdAt = createdAt
)

private fun GroupV2CommentRow.toCommentItem(currentUserId: String?, currentDisplayName: String? = null): ReadingGroupCommentItem {
    return ReadingGroupCommentItem(
        id = legacyId ?: stableUiId(id),
        displayName = resolveGroupAuthorName(currentDisplayName, displayNameSnapshot),
        content = content,
        createdAt = createdAt,
        serverId = id,
        createdBy = createdBy,
        isMine = currentUserId != null && createdBy == currentUserId
    )
}

private fun GroupV2InvitationRow.toInvitation(): ReadingGroupInvitationRow {
    return ReadingGroupInvitationRow(
        id = id,
        token = token,
        invitedEmail = invitedEmail,
        status = status,
        maxUses = maxUses,
        useCount = useCount,
        expiresAt = expiresAt,
        createdAt = createdAt
    )
}

private fun GroupV2JoinRequestRow.toJoinRequest(): ReadingGroupJoinRequestRow {
    return ReadingGroupJoinRequestRow(
        id = id,
        userId = userId,
        displayName = displayName,
        avatarUrl = avatarUrl,
        message = message,
        status = status,
        createdAt = createdAt,
        reviewedAt = reviewedAt
    )
}

private fun stableUiId(id: String): Long {
    return runCatching {
        val uuid = UUID.fromString(id)
        (uuid.mostSignificantBits xor uuid.leastSignificantBits) and Long.MAX_VALUE
    }.getOrElse {
        (id.hashCode().toLong() and 0x7fffffffL) + 1L
    }.coerceAtLeast(1L)
}

private fun progressStreak(dateKeys: Set<String>): Int {
    if (dateKeys.isEmpty()) return 0
    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val calendar = Calendar.getInstance()
    var current = formatter.format(calendar.time)
    if (current !in dateKeys) {
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        current = formatter.format(calendar.time)
    }
    var streak = 0
    while (current in dateKeys) {
        streak++
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        current = formatter.format(calendar.time)
    }
    return streak
}

private fun dateKeyDaysAgo(daysAgo: Int): String {
    val calendar = Calendar.getInstance()
    calendar.add(Calendar.DAY_OF_YEAR, -daysAgo.coerceAtLeast(0))
    return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(calendar.time)
}
