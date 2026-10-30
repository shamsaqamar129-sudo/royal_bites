/**
 * Firestore Security Rules Specification Test Suite
 * Verifies all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on User Profile',
    collectionPath: '/users/user_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'guest@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      displayName: 'Guest',
      photoURL: '',
      wishlist: [],
      recentlyViewed: [],
      isAdmin: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Bootstrapped Admin Email Spoof',
    collectionPath: '/menuItems/dish_spoof',
    operation: 'create',
    auth: { uid: 'spoof_uid', email: 'shamsaqamar129@gmail.com', email_verified: false },
    payload: { name: 'Spoof Dish', category: 'Burgers', price: 10 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User PII Read on Private Profile',
    collectionPath: '/users/victim_uid/private/profile',
    operation: 'get',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unfiltered Order List Scraping by Non-Admin',
    collectionPath: '/orders',
    operation: 'list',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Customer Escalating Order Status to Completed',
    collectionPath: '/orders/order_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'guest@example.com', email_verified: true },
    payload: { status: 'Completed' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Mutating Terminal Cancelled Order by Customer',
    collectionPath: '/orders/order_cancelled',
    operation: 'update',
    auth: { uid: 'user_1', email: 'guest@example.com', email_verified: true },
    payload: { status: 'Pending' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Forged Past Timestamp on Review Creation',
    collectionPath: '/reviews/rev_forged',
    operation: 'create',
    auth: { uid: 'user_1', email: 'guest@example.com', email_verified: true },
    payload: {
      userId: 'user_1',
      authorName: 'Guest',
      dishName: 'Wagyu',
      rating: 5,
      comment: 'Forged timestamp attempt.',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Invalid Special Characters in Document ID',
    collectionPath: '/users/user_1/addresses/invalid$id!',
    operation: 'create',
    auth: { uid: 'user_1', email: 'guest@example.com', email_verified: true },
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Oversized 10KB Review Comment String',
    collectionPath: '/reviews/rev_huge',
    operation: 'create',
    auth: { uid: 'user_1', email: 'guest@example.com', email_verified: true },
    payload: {
      userId: 'user_1',
      authorName: 'Guest',
      dishName: 'Wagyu',
      rating: 5,
      comment: 'x'.repeat(10000),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Orphaned Address Without Parent User Document',
    collectionPath: '/users/missing_user/addresses/addr_1',
    operation: 'create',
    auth: { uid: 'missing_user', email: 'missing@example.com', email_verified: true },
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Identity Spoofing Order Owner UID',
    collectionPath: '/orders/order_spoof',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: { userId: 'victim_uid' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Value Type Poisoning on User Update',
    collectionPath: '/users/user_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'guest@example.com', email_verified: true },
    payload: { displayName: 999999 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
