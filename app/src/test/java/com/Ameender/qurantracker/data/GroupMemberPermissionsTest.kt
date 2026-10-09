package com.Ameender.qurantracker.data

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Test

class GroupMemberPermissionsTest {
    @Test fun defaultValuesAreSentExplicitly() {
        val encoded = Json.parseToJsonElement(Json.encodeToString(GroupMemberPermissions())).jsonObject
        assertEquals(4, encoded.size)
        assertEquals("true", encoded["canPostMessages"].toString())
        assertEquals("false", encoded["canInviteMembers"].toString())
    }

    @Test fun allSwitchCombinationsRoundTrip() {
        for (mask in 0..15) {
            val settings = GroupMemberPermissions(mask and 1 != 0, mask and 2 != 0,
                mask and 4 != 0, mask and 8 != 0)
            assertEquals(settings, Json.decodeFromString<GroupMemberPermissions>(Json.encodeToString(settings)))
        }
    }
}
