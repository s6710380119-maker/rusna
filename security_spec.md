# Security Specification & Test Payloads (security_spec.md)

## 1. Core Data Invariants & Zero-Trust ABAC
1. **Identity & Ownership Integrity**: A user can never create or update a resource with an `authorId` different from `request.auth.uid`.
2. **Privilege Escalation Prevention**: A user cannot assign themselves the role `admin` or modify their own `role` or `status` in `/users/{userId}`. Only administrators or initial bootstrap rules can modify roles.
3. **Immutability of Author & Timestamps**: The `authorId` and `createdAt` of a resource, report, or favorite cannot be changed after creation.
4. **PII and Private Isolation**: Only the document owner or an admin can read private user account settings or audit moderation logs.
5. **State Lockdown & Input Validation**: All fields must conform to strict length, schema, and allowed enumeration values. No unwhitelisted ghost fields.
6. **Public vs Member Access**: Unauthenticated visitors (public) can read published resources (`status == 'published'`) and site settings. Only authenticated verified members can create resources, favorites, and reports.
7. **Moderation Lockdown**: Only verified Admins (`s6710380119@pkru.ac.th` or users with `role == 'admin'` in `/users`) can update site settings, inspect all reports, hide resources, change user roles, or record moderation logs.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Privilege Escalation on User Creation)**:
   Attempt by a regular registered user to self-assign `role: 'admin'`.
   `{ "uid": "attacker_123", "email": "attacker@example.com", "displayName": "Attacker", "role": "admin", "status": "active" }` -> MUST BE DENIED.

2. **Payload 2 (Ghost Field Injection / Shadow Update on Profile)**:
   Attempt to update user profile with unexpected admin flag:
   `{ "isSuperUser": true, "vip": true }` -> MUST BE DENIED.

3. **Payload 3 (Spoofed Resource Author UID)**:
   Authenticated user `user_A` creating a resource claiming `authorId: 'user_B'`.
   `{ "title": "Fake Math Guide", "authorId": "user_B", "url": "https://example.com" }` -> MUST BE DENIED.

4. **Payload 4 (Unauthorized Resource Update)**:
   Authenticated user `user_A` modifying a resource owned by `user_B`.
   `{ "title": "Hacked Title" }` -> MUST BE DENIED.

5. **Payload 5 (Oversized Denial of Wallet Title Injection)**:
   Attempt to write a title of 50,000 characters to bloat database storage:
   `{ "title": "A".repeat(50000), ... }` -> MUST BE DENIED.

6. **Payload 6 (Invalid Enum Poisoning)**:
   Attempt to set `mediaType: 'executable'` or `status: 'super_admin_only'`.
   -> MUST BE DENIED.

7. **Payload 7 (Tampering with Immutability - Author Hijack)**:
   Attempt to update `authorId` on an existing resource:
   `{ "authorId": "attacker_new_id" }` -> MUST BE DENIED.

8. **Payload 8 (Unauthorized Deletion)**:
   Regular member attempting to delete another author's educational resource:
   `DELETE /resources/victim_resource_id` by non-owner, non-admin -> MUST BE DENIED.

9. **Payload 9 (Fake Moderator Action / Writing Moderation Log)**:
   Non-admin user attempting to create a record in `/moderationLogs/`:
   `{ "action": "suspend_user", "performedByUid": "attacker" }` -> MUST BE DENIED.

10. **Payload 10 (Direct Site Settings Override)**:
    Regular member writing to `/settings/general`:
    `{ "siteName": "Defaced Educational Portal" }` -> MUST BE DENIED.

11. **Payload 11 (Duplicate/Spoofed Bookmark Injection)**:
    User `user_A` creating a favorite document in `/favorites/` under `userId: 'user_B'`.
    `{ "userId": "user_B", "resourceId": "res_1" }` -> MUST BE DENIED.

12. **Payload 12 (Unauthorized Status Modification to Bypass Moderation)**:
    Suspended or normal user attempting to force unhide a flagged resource that was hidden by a moderator:
    `{ "status": "published" }` by non-admin when previously set to `hidden` -> MUST BE DENIED.
