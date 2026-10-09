package com.Ameender.qurantracker.ui

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GroupJoinRoutingTest {
    @Test fun privateGroupOffersRequest() {
        assertTrue(requiresGroupAccessRequest(IllegalStateException("GROUP_INVITATION_REQUIRED"), false))
    }

    @Test fun wrappedPrivateGroupOffersRequest() {
        assertTrue(requiresGroupAccessRequest(RuntimeException("RPC failed", IllegalStateException("GROUP_INVITATION_REQUIRED")), false))
    }

    @Test fun secureInvitationNeverFallsBackToRequest() {
        assertFalse(requiresGroupAccessRequest(IllegalStateException("GROUP_INVITATION_REQUIRED"), true))
    }

    @Test fun otherFailuresDoNotOfferRequest() {
        listOf("GROUP_NOT_FOUND", "GROUP_MEMBER_BLOCKED", "AUTH_REQUIRED", "INVITATION_EXPIRED", "Network unavailable", "NOT_GROUP_INVITATION_REQUIRED").forEach {
            assertFalse(it, requiresGroupAccessRequest(IllegalStateException(it), false))
        }
    }
}
