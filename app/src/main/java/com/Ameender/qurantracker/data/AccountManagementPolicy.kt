package com.Ameender.qurantracker.data

/** Shared UI/service validation. Passwords must never be trimmed or persisted. */
object AccountManagementPolicy {
    const val MIN_PASSWORD_LENGTH = 12
    fun validPassword(password: String) = password.length in MIN_PASSWORD_LENGTH..128 && password.isNotBlank()
    fun matchingPasswords(password: String, confirmation: String) = validPassword(password) && password == confirmation
    fun validEmail(email: String) = email.trim().length <= 254 &&
        Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(email.trim())
    fun changedEmail(current: String, proposed: String) = validEmail(proposed) && !current.trim().equals(proposed.trim(), true)
    fun deletionConfirmed(email: String, confirmation: String) = email.isNotBlank() && email.equals(confirmation.trim(), true)
}
