# Royal Bites Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity**: All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Admin Authority**: Admin privileges derive exclusively from verified bootstrapped runtime email (`shamsaqamar129@gmail.com` with `email_verified == true`) or existence in `/admins/$(request.auth.uid)`. Client claims or profile fields never grant admin rights.
4. **PII Split Isolation**: Customer emails, phone numbers, and street addresses live strictly in `/users/{userId}/private/profile`, `/users/{userId}/addresses/{addressId}`, `/orders/{orderId}`, `/reservations/{reservationId}`, and `/newsletterSubscribers/{subscriberId}`, readable ONLY by the document owner (`request.auth.uid`) or `isAdmin()`.
5. **Master Gate & Atomic Order Line Items**: `/users/{userId}/addresses/{addressId}` requires `/users/{userId}` to exist. `/orders/{orderId}/items/{lineId}` requires atomic or existing parent `/orders/{orderId}` owned by `request.auth.uid` via `getAfter`/`get`.
6. **Terminal State Locking**: Orders in `'Completed'` or `'Cancelled'` status and Reservations in `'Completed'` or `'Cancelled'` status cannot be mutated by standard users; only `isAdmin()` can override terminal states.
7. **Temporal & Ownership Immutability**: `createdAt` and `updatedAt` must equal `request.time` on write; `createdAt`, `userId`, `uid`, and `orderId` are immutable across updates.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection (`/users/{uid}`)**: `{ uid: "u1", displayName: "Chef", photoURL: "", wishlist: [], recentlyViewed: [], isAdmin: true, createdAt: SERVER_TIME, updatedAt: SERVER_TIME }` -> Rejected by `hasOnly()`.
2. **Unverified Admin Email Spoof (`/menuItems/m1`)**: Authenticated token `{ email: "shamsaqamar129@gmail.com", email_verified: false }` attempting menu creation -> Rejected by `isVerified()`.
3. **Cross-User PII Scrape (`GET /users/victimUid/private/profile`)**: Authenticated attacker `attackerUid` reading another user's private profile -> Rejected by `request.auth.uid == userId`.
4. **Blanket Order List Scraping (`LIST /orders` without `where('userId', '==', uid)`)**: Authenticated user listing all orders -> Rejected by `resource.data.userId == request.auth.uid`.
5. **Order Status Escalation (`UPDATE /orders/o1`)**: Customer attempting to change `status` from `'Pending'` to `'Completed'` -> Rejected by action allowlist (customers may only transition `'Pending'` -> `'Cancelled'`).
6. **Terminal State Re-opening (`UPDATE /orders/o1`)**: Customer attempting to modify a `'Cancelled'` order -> Rejected by terminal state lock `existing().status == 'Pending'`.
7. **Client Timestamp Forgery (`CREATE /reviews/r1`)**: Submitting `createdAt: Timestamp(2020, 1, 1)` instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
8. **ID Poisoning (`CREATE /users/u1/addresses/bad$id!@#`)**: Non-alphanumeric or >128 char document ID -> Rejected by `isValidId()`.
9. **Denial-of-Wallet String Megabyte Payload (`CREATE /reviews/r2`)**: `comment` of 50,000 characters -> Rejected by `data.comment.size() <= 600`.
10. **Orphaned Subcollection Write (`CREATE /users/u_missing/addresses/a1`)**: Creating an address without a parent `/users/u_missing` profile -> Rejected by `exists(/databases/$(database)/documents/users/$(userId))`.
11. **Identity Spoofing on Order (`CREATE /orders/o2`)**: Authenticated `attackerUid` setting `userId: "victimUid"` -> Rejected by `incoming().userId == request.auth.uid`.
12. **Value Poisoning on Update (`UPDATE /users/u1`)**: Updating `displayName` to integer `99999` -> Rejected because `isValidUserPublic(incoming())` wraps the entire `allow update` block.
