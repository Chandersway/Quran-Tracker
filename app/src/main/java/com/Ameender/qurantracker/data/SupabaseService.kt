package com.Ameender.qurantracker.data

import android.content.Intent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ReadingGroupInsert(
    val code: String,
    val name: String,
    val description: String,
    val goal: String,
    val unit: String,
    @SerialName("owner_id") val ownerId: String
)

@Serializable
data class ReadingGroupSummary(
    val code: String,
    val name: String,
    val description: String = "",
    val goal: String,
    val unit: String
)

@Serializable
data class ReadingGroupMemberInsert(
    @SerialName("group_code") val groupCode: String,
    @SerialName("user_id") val userId: String,
    @SerialName("display_name") val displayName: String,
    val role: String
)

@Serializable
data class ReadingGroupProgressInsert(
    @SerialName("group_code") val groupCode: String,
    @SerialName("user_id") val userId: String,
    val unit: String,
    val amount: Int,
    val source: String,
    @SerialName("date_key") val dateKey: String
)

@Serializable
data class ReadingGroupProgressRow(
    @SerialName("user_id") val userId: String,
    val unit: String,
    val amount: Int
)

data class ReadingGroupLeaderboardRow(
    val label: String,
    val totalPoints: Int,
    val details: String
)

object SupabaseConfig {
    const val URL = "https://oynnehvcmwlizpkmjtdp.supabase.co"
    const val ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bm5laHZjbXdsaXpwa21qdGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjcxMzcsImV4cCI6MjA5NTQwMzEzN30.QFb3iXh_Xuhf_GX58eDXFsUBUAc99unHDkkrMI1lO_4"
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
                }
                install(Postgrest)
            }
        }
    }

    private val client: SupabaseClient
        get() = clientOrNull ?: error("Supabase is nog niet ingesteld.")

    suspend fun currentUserEmail(): String? {
        return clientOrNull?.auth?.currentSessionOrNull()?.user?.email
    }

    suspend fun createReadingGroup(
        name: String,
        description: String,
        goal: String,
        unit: String,
        code: String
    ) {
        val user = client.auth.currentUserOrNull() ?: error("Log eerst in om een groep te maken.")
        client.from("reading_groups").insert(
            ReadingGroupInsert(
                code = code,
                name = name,
                description = description,
                goal = goal,
                unit = unit,
                ownerId = user.id
            )
        )
        client.from("reading_group_members").insert(
            ReadingGroupMemberInsert(
                groupCode = code,
                userId = user.id,
                displayName = user.email ?: "Gebruiker",
                role = "owner"
            )
        )
    }

    suspend fun joinReadingGroup(code: String) {
        val cleanCode = code.trim().uppercase()
        val user = client.auth.currentUserOrNull() ?: error("Log eerst in om deel te nemen aan een groep.")
        val group = client.from("reading_groups")
            .select {
                filter { eq("code", cleanCode) }
                single()
            }
            .decodeSingleOrNull<ReadingGroupSummary>()
            ?: error("Geen groep gevonden met code $cleanCode.")

        client.from("reading_group_members").insert(
            ReadingGroupMemberInsert(
                groupCode = group.code,
                userId = user.id,
                displayName = user.email ?: "Gebruiker",
                role = "member"
            )
        )
    }

    suspend fun recordGroupProgress(
        code: String,
        unit: String,
        amount: Int,
        source: String = "manual"
    ) {
        val cleanCode = code.trim().uppercase()
        val safeAmount = amount.coerceIn(1, 10_000)
        val user = client.auth.currentUserOrNull() ?: error("Log eerst in om voortgang te delen.")
        client.from("reading_group_progress").insert(
            ReadingGroupProgressInsert(
                groupCode = cleanCode,
                userId = user.id,
                unit = unit,
                amount = safeAmount,
                source = source,
                dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            )
        )
    }

    suspend fun loadGroupLeaderboard(code: String): List<ReadingGroupLeaderboardRow> {
        val cleanCode = code.trim().uppercase()
        val rows = client.from("reading_group_progress")
            .select {
                filter { eq("group_code", cleanCode) }
            }
            .decodeList<ReadingGroupProgressRow>()

        return rows
            .groupBy { it.userId }
            .map { (userId, userRows) ->
                val ayahs = userRows.filter { it.unit == "ayah" }.sumOf { it.amount }
                val pages = userRows.filter { it.unit == "page" }.sumOf { it.amount }
                val hizb = userRows.filter { it.unit == "hizb" }.sumOf { it.amount }
                val points = ayahs + (pages * 10) + (hizb * 80)
                ReadingGroupLeaderboardRow(
                    label = "Lid ${userId.take(6)}",
                    totalPoints = points,
                    details = "${ayahs} ayah · ${pages} pagina · ${hizb} hizb"
                )
            }
            .sortedByDescending { it.totalPoints }
    }

    suspend fun signIn(email: String, password: String) {
        client.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun signUp(email: String, password: String) {
        client.auth.signUpWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun signInWithGoogle() {
        client.auth.signInWith(Google, redirectUrl = "${SupabaseConfig.DEEPLINK_SCHEME}://${SupabaseConfig.DEEPLINK_HOST}")
    }

    suspend fun signOut() {
        client.auth.signOut()
    }

    fun handleDeeplinks(intent: Intent) {
        clientOrNull?.handleDeeplinks(intent)
    }
}
