package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class AccountManagementTextTest {
    @Test fun allActionsAndSafetyMessagesHaveTranslations() {
        val keys = listOf("title", "subtitle", "password", "email", "delete", "forgot", "reset",
            "save", "cancel", "done", "currentPassword", "newPassword", "repeatPassword",
            "passwordHelp", "mismatch", "newEmail", "emailLabel", "emailHelp", "invalidEmail",
            "resetHelp", "resetSent", "passwordSaved", "emailSent", "google", "googleStatus",
            "emailStatus", "deleteHelp", "confirmEmail", "checking", "notReady", "ownedGroups",
            "linkedData", "recentLogin", "deleted", "wrongPassword", "rateLimit", "error",
            "passwordRejected", "code", "sendCode", "codeHelp", "codeSent", "visibility")
        for (language in listOf("nl", "en", "fr", "ar")) for (key in keys) {
            val text = accountManagementText(language, key)
            assertTrue("$language/$key", text.isNotBlank())
            assertNotEquals("$language/$key", key, text)
        }
    }

    @Test fun accountProviderLabelsAreDifferent() {
        for (language in listOf("nl", "en", "fr", "ar")) {
            assertNotEquals(accountManagementText(language, "googleStatus"), accountManagementText(language, "emailStatus"))
        }
    }
}
