package com.Ameender.qurantracker.data

import org.junit.Assert.*
import org.junit.Test

class AccountManagementPolicyTest {
    @Test fun passwordsHaveExplicitBounds() {
        assertFalse(AccountManagementPolicy.validPassword("short"))
        assertFalse(AccountManagementPolicy.validPassword(" ".repeat(12)))
        assertTrue(AccountManagementPolicy.validPassword("a".repeat(12)))
        assertTrue(AccountManagementPolicy.validPassword("a".repeat(128)))
        assertFalse(AccountManagementPolicy.validPassword("a".repeat(129)))
    }
    @Test fun passwordConfirmationIsExactIncludingWhitespace() {
        assertTrue(AccountManagementPolicy.matchingPasswords("long password!", "long password!"))
        assertFalse(AccountManagementPolicy.matchingPasswords("long password! ", "long password!"))
        assertFalse(AccountManagementPolicy.matchingPasswords("long password!", "Long password!"))
    }
    @Test fun emailChangeRejectsInvalidAndUnchangedAddresses() {
        assertFalse(AccountManagementPolicy.changedEmail("a@example.com", " A@EXAMPLE.COM "))
        assertFalse(AccountManagementPolicy.changedEmail("a@example.com", "invalid"))
        assertFalse(AccountManagementPolicy.validEmail("a b@example.com"))
        assertTrue(AccountManagementPolicy.changedEmail("a@example.com", "new@example.com"))
    }
    @Test fun deletionRequiresExactAccountEmailNotAnEmptyOrPartialConfirmation() {
        assertFalse(AccountManagementPolicy.deletionConfirmed("", ""))
        assertFalse(AccountManagementPolicy.deletionConfirmed("a@example.com", "a"))
        assertFalse(AccountManagementPolicy.deletionConfirmed("a@example.com", "b@example.com"))
        assertTrue(AccountManagementPolicy.deletionConfirmed("a@example.com", " A@example.com "))
    }
}
