package com.Ameender.qurantracker.ui

/** Only an explicit private-group refusal offers an access request; secure invites keep their own errors. */
internal fun requiresGroupAccessRequest(error: Throwable, hasInvitationToken: Boolean): Boolean {
    if (hasInvitationToken) return false
    return generateSequence(error) { it.cause }.take(10).any {
        Regex("\\bGROUP_INVITATION_REQUIRED\\b").containsMatchIn(it.message.orEmpty())
    }
}
