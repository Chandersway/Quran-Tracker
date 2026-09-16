package com.Ameender.qurantracker.data

import android.content.Context

object ProfileAvatarService {
    private const val PREFS_NAME = "profile_avatar_cache"
    private const val AVATAR_PREFIX = "avatar:"
    private const val DISPLAY_NAME_PREFIX = "display_name:"

    fun resolveAvatarUrl(
        customAvatarUrl: String?,
        uploadedAvatarUrl: String?,
        googlePhotoUrl: String?
    ): String? {
        return customAvatarUrl?.takeIf { it.isNotBlank() }
            ?: uploadedAvatarUrl?.takeIf { it.isNotBlank() }
            ?: googlePhotoUrl?.takeIf { it.isNotBlank() }
    }

    fun cacheUploadedAvatarUrl(context: Context, accountKey: String, avatarUrl: String) {
        if (accountKey.isBlank() || avatarUrl.isBlank()) return
        context.applicationContext
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(cacheKey(AVATAR_PREFIX, accountKey), avatarUrl)
            .apply()
    }

    fun cachedUploadedAvatarUrl(context: Context, accountKey: String?): String? {
        if (accountKey.isNullOrBlank()) return null
        return context.applicationContext
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(cacheKey(AVATAR_PREFIX, accountKey), null)
            ?.takeIf { it.isNotBlank() }
    }

    fun resolveDisplayName(
        customDisplayName: String?,
        uploadedDisplayName: String?,
        googleDisplayName: String?,
        fallbackEmail: String?
    ): String {
        return customDisplayName?.takeIf { it.isNotBlank() }
            ?: uploadedDisplayName?.takeIf { it.isNotBlank() }
            ?: googleDisplayName?.takeIf { it.isNotBlank() }
            ?: fallbackEmail?.substringBefore("@")?.takeIf { it.isNotBlank() }
            ?: "Gebruiker"
    }

    fun cacheUploadedDisplayName(context: Context, accountKey: String, displayName: String) {
        val safeName = displayName.trim().take(40)
        if (accountKey.isBlank() || safeName.isBlank()) return
        context.applicationContext
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(cacheKey(DISPLAY_NAME_PREFIX, accountKey), safeName)
            .apply()
    }

    fun cachedUploadedDisplayName(context: Context, accountKey: String?): String? {
        if (accountKey.isNullOrBlank()) return null
        return context.applicationContext
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(cacheKey(DISPLAY_NAME_PREFIX, accountKey), null)
            ?.takeIf { it.isNotBlank() }
    }

    fun withCachedAvatar(context: Context, account: UserAccount?): UserAccount? {
        if (account == null) return null
        val cachedAvatarUrl = cachedUploadedAvatarUrl(context, account.email)
        val cachedDisplayName = cachedUploadedDisplayName(context, account.email)
        val displayAvatarUrl = resolveAvatarUrl(
            customAvatarUrl = account.customAvatarUrl,
            uploadedAvatarUrl = cachedAvatarUrl,
            googlePhotoUrl = account.providerAvatarUrl
        )
        val displayName = resolveDisplayName(
            customDisplayName = account.customDisplayName,
            uploadedDisplayName = cachedDisplayName,
            googleDisplayName = account.providerDisplayName,
            fallbackEmail = account.email
        )
        return account.copy(
            displayName = displayName,
            avatarUrl = displayAvatarUrl,
            uploadedAvatarUrl = cachedAvatarUrl,
            uploadedDisplayName = cachedDisplayName
        )
    }

    private fun cacheKey(prefix: String, accountKey: String): String {
        return prefix + accountKey.trim().lowercase()
    }
}
