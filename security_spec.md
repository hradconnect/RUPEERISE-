# Firestore Security Specification - Multi-Level Referral & Rewards Platform

## 1. Data Invariants
- A **User** must have a unique UID matching their Auth ID.
- Users can only modify their own profile data (name, KYC, bank details).
- **Withdrawals** must be created in 'pending' status.
- Only **Admins** can approve/reject withdrawals or VIP requests.
- **Referral Earnings** are system-generated (via server) or admin-created; users can only read their own earnings.
- **System Settings** are read-only for users, modifiable only by admins.

## 2. The "Dirty Dozen" Payloads (Test Cases)
1. **Identity Spoofing**: User A trying to create a withdrawal with User B's UID.
2. **State Shortcutting**: User trying to create a withdrawal with status 'approved'.
3. **Privilege Escalation**: User trying to update their own role to 'admin'.
4. **Illegal Balance Update**: User trying to increase their own balance directly.
5. **PII Blanket Leak**: User trying to list all users' KYC documents.
6. **Query Scraping**: User trying to list withdrawals without a UID filter.
7. **Resource Poisoning**: Creating a withdrawal with a 1MB string in the transaction ID.
8. **Impersonation**: User trying to update another user's bank details.
9. **Settings Tamper**: User trying to change the commission rate in global settings.
10. **Referral Fraud**: User trying to create their own referral earnings entry.
11. **Negative Withdrawal**: User trying to withdraw a negative amount.
12. **Status Lock Bypass**: Admin trying to change an already 'approved' withdrawal back to 'pending'.

## 3. Implementation Patterns
- **Master Gate**: Access to child resources (earnings, logs) is derived from owner UID.
- **Validation Blueprints**: `isValidUser`, `isValidWithdrawal` helpers.
- **Tiered Identity**: Admin vs User separation.
- **Denial of Wallet**: Auth check first, then static validation, then relational checks.
