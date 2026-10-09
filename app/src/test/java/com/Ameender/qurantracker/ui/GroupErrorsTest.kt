package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class GroupErrorsTest {
    @Test fun allMessagesTranslated() {
        val keys = listOf("inviteInvalid", "wrongAccount", "emailInvalid", "expiryInvalid",
            "approval", "blocked", "notFound", "alreadyMember", "permission", "login",
            "session", "network", "messageLong", "requestMissing")
        for (key in keys) {
            val translations = listOf("nl", "en", "ar").map {
                AppText.strings(it).t("groups.error.$key")
            }
            assertEquals(key, 3, translations.toSet().size)
            translations.forEach { assertFalse(it.startsWith("groups.error.")) }
        }
    }

    @Test fun backendReasonsAndNestedErrorsAreMapped() {
        val cases = mapOf("INVITATION_INVALID_OR_EXPIRED" to "inviteInvalid",
            "INVITATION_EMAIL_MISMATCH" to "wrongAccount", "GROUP_INVITATION_REQUIRED" to "approval",
            "GROUP_MEMBER_BLOCKED" to "blocked", "GROUP_NOT_FOUND" to "notFound",
            "ALREADY_GROUP_MEMBER" to "alreadyMember", "AUTH_REQUIRED" to "login")
        for (lang in listOf("nl", "en", "ar")) {
            val text = AppText.strings(lang)
            cases.forEach { (code, key) ->
                assertEquals(text.t("groups.error.$key"),
                    localizedGroupError(RuntimeException("RPC failed", Exception(code)), text, "fallback"))
            }
        }
    }

    @Test fun unknownErrorNeverLeaksDetailsOrClaimsMembership() {
        val text = AppText.strings("en")
        for (raw in listOf("secret token abc", "duplicate key", "NOT_GROUP_NOT_FOUND", "")) {
            assertEquals("fallback", localizedGroupError(Exception(raw), text, "fallback"))
        }
    }

    @Test fun networkAndSessionHaveRecoveryAdvice() {
        val text = AppText.strings("ar")
        assertEquals(text.t("groups.error.network"), localizedGroupError(Exception("Unable to resolve host"), text, "fallback"))
        assertEquals(text.t("groups.error.session"), localizedGroupError(Exception("refresh token expired"), text, "fallback"))
    }
}
