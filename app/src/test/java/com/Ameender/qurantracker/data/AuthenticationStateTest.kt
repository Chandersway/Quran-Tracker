package com.Ameender.qurantracker.data

import org.junit.Assert.assertEquals
import org.junit.Test

class AuthenticationStateTest {
    private val authenticated = AuthenticationState.Authenticated(
        userId = "user-123",
        email = "reader@example.com"
    )

    @Test
    fun signedOutUserSeesLoginRequirement() {
        assertEquals(
            ProtectedAuthAccess.LoginRequired,
            AuthenticationState.SignedOut.protectedAccess()
        )
    }

    @Test
    fun sessionRestoreShowsLoadingUntilAuthenticationIsKnown() {
        val states = listOf(
            AuthenticationState.Checking,
            authenticated
        )

        assertEquals(
            listOf(ProtectedAuthAccess.Loading, ProtectedAuthAccess.Content),
            states.map(AuthenticationState::protectedAccess)
        )
    }

    @Test
    fun emailLoginUnlocksProtectedContentImmediately() {
        assertLoginTransition(AuthenticationState.SignedOut, authenticated)
    }

    @Test
    fun emailRegistrationWithSessionUnlocksProtectedContentImmediately() {
        assertLoginTransition(AuthenticationState.SignedOut, authenticated)
    }

    @Test
    fun googleCallbackUnlocksContentAfterOAuthCheck() {
        assertLoginTransition(AuthenticationState.Checking, authenticated)
    }

    @Test
    fun refreshFailureKeepsLoginMessageHiddenWhileSessionIsChecked() {
        assertEquals(
            ProtectedAuthAccess.Loading,
            AuthenticationState.Checking.protectedAccess()
        )
    }

    private fun assertLoginTransition(
        before: AuthenticationState,
        after: AuthenticationState.Authenticated
    ) {
        assertEquals(ProtectedAuthAccess.Content, after.protectedAccess())
        assertEquals(
            listOf(before.protectedAccess(), ProtectedAuthAccess.Content),
            listOf(before, after).map(AuthenticationState::protectedAccess)
        )
    }
}
