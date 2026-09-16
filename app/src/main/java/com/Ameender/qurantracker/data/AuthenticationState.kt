package com.Ameender.qurantracker.data

/**
 * App-wide authentication state. SupabaseService is the only writer; UI screens only observe it.
 */
sealed interface AuthenticationState {
    data object Checking : AuthenticationState

    data class Authenticated(
        val userId: String,
        val email: String?
    ) : AuthenticationState

    data object SignedOut : AuthenticationState
}

internal enum class ProtectedAuthAccess {
    Loading,
    Content,
    LoginRequired
}

internal fun AuthenticationState.protectedAccess(): ProtectedAuthAccess = when (this) {
    AuthenticationState.Checking -> ProtectedAuthAccess.Loading
    is AuthenticationState.Authenticated -> ProtectedAuthAccess.Content
    AuthenticationState.SignedOut -> ProtectedAuthAccess.LoginRequired
}
