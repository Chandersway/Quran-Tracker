package com.Ameender.qurantracker.ui

internal fun localizedGroupError(error: Throwable, text: AppStrings, fallback: String): String {
    val raw = generateSequence(error) { it.cause }.take(10)
        .joinToString("\n") { it.message.orEmpty() }
    val codes = Regex("\\b[A-Z][A-Z_]+\\b").findAll(raw).map { it.value }.toSet()
    val mapping = linkedMapOf(
        "INVITATION_INVALID_OR_EXPIRED" to "inviteInvalid",
        "INVITATION_NOT_FOUND" to "inviteInvalid",
        "INVITATION_EMAIL_MISMATCH" to "wrongAccount",
        "INVITATION_EMAIL_INVALID" to "emailInvalid",
        "INVITATION_EXPIRY_INVALID" to "expiryInvalid",
        "GROUP_INVITATION_REQUIRED" to "approval",
        "GROUP_MEMBER_BLOCKED" to "blocked",
        "GROUP_NOT_FOUND" to "notFound",
        "ALREADY_GROUP_MEMBER" to "alreadyMember",
        "GROUP_PERMISSION_DENIED" to "permission",
        "GROUP_POST_FORBIDDEN" to "permission",
        "GROUP_PROGRESS_FORBIDDEN" to "permission",
        "GROUP_COMMENT_FORBIDDEN" to "permission",
        "GROUP_UPDATE_FORBIDDEN" to "permission",
        "GROUP_ACCESS_FORBIDDEN" to "permission",
        "AUTH_REQUIRED" to "login",
        "JOIN_REQUEST_MESSAGE_TOO_LONG" to "messageLong",
        "JOIN_REQUEST_NOT_FOUND" to "requestMissing"
    )
    val codeKey = mapping.entries.firstOrNull { it.key in codes }?.value
    val lower = raw.lowercase()
    val key = codeKey ?: when {
        listOf("user not found", "refresh token", "session", "jwt expired").any { it in lower } -> "session"
        listOf("unable to resolve host", "network", "failed to connect", "timeout", "timed out").any { it in lower } -> "network"
        listOf("geen groep gevonden", "0 rows", "cannot coerce").any { it in lower } -> "notFound"
        "log eerst in" in lower -> "login"
        else -> null
    }
    // Never show raw backend details, addresses or tokens.
    return key?.let { text.t("groups.error.$it") } ?: fallback
}
