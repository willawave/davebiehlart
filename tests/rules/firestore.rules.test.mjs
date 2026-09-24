import assert from 'node:assert/strict';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  ADMIN_EMAIL,
  ADMIN_UID,
  OUTSIDER_EMAIL,
  OUTSIDER_UID,
  SECOND_ADMIN_UID,
  VISIBLE_COLLECTIONS,
  contexts,
  setupTestEnv,
} from './helpers.mjs';

let testEnv;
let ctx;

before(async () => {
  testEnv = await setupTestEnv();
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  ctx = contexts(testEnv);
  await testEnv.withSecurityRulesDisabled(async (c) => {
    for (const name of [...VISIBLE_COLLECTIONS, 'schedule']) {
      await setDoc(doc(c.firestore(), name, 'published'), { name: 'seed', visible: true });
      await setDoc(doc(c.firestore(), name, 'hidden'), { name: 'seed', visible: false });
    }
  });
});

for (const name of VISIBLE_COLLECTIONS) {
  describe(`/${name}`, () => {
    test('anyone can get a document by ID, including hidden ones', async () => {
      for (const c of [ctx.anon, ctx.outsider]) {
        await assertSucceeds(getDoc(doc(c.firestore(), name, 'published')));
        await assertSucceeds(getDoc(doc(c.firestore(), name, 'hidden')));
      }
    });

    test('anyone can list when the query filters on visible == true', async () => {
      for (const c of [ctx.anon, ctx.outsider]) {
        const visible = query(collection(c.firestore(), name), where('visible', '==', true));
        await assertSucceeds(getDocs(visible));
      }
    });

    test('non-admins cannot enumerate hidden documents', async () => {
      for (const c of [ctx.anon, ctx.outsider]) {
        await assertFails(getDocs(collection(c.firestore(), name)));
        const hidden = query(collection(c.firestore(), name), where('visible', '==', false));
        await assertFails(getDocs(hidden));
      }
    });

    test('admins can list everything', async () => {
      await assertSucceeds(getDocs(collection(ctx.admin.firestore(), name)));
    });

    test('signed-out visitors cannot write', async () => {
      const db = ctx.anon.firestore();
      await assertFails(setDoc(doc(db, name, 'new'), { name: 'x' }));
      await assertFails(updateDoc(doc(db, name, 'published'), { name: 'x' }));
      await assertFails(deleteDoc(doc(db, name, 'published')));
    });

    test('signed-in non-admins cannot write', async () => {
      const db = ctx.outsider.firestore();
      await assertFails(setDoc(doc(db, name, 'new'), { name: 'x' }));
      await assertFails(updateDoc(doc(db, name, 'published'), { name: 'x' }));
      await assertFails(deleteDoc(doc(db, name, 'published')));
    });

    test('admins can create, update, and delete', async () => {
      const db = ctx.admin.firestore();
      await assertSucceeds(setDoc(doc(db, name, 'new'), { name: 'x' }));
      await assertSucceeds(updateDoc(doc(db, name, 'published'), { name: 'y' }));
      await assertSucceeds(deleteDoc(doc(db, name, 'published')));
    });
  });
}

describe('/schedule', () => {
  test('anyone can get and list', async () => {
    await assertSucceeds(getDoc(doc(ctx.anon.firestore(), 'schedule', 'published')));
    await assertSucceeds(getDocs(collection(ctx.anon.firestore(), 'schedule')));
  });

  test('only admins can write', async () => {
    for (const c of [ctx.anon, ctx.outsider]) {
      await assertFails(setDoc(doc(c.firestore(), 'schedule', 'new'), { name: 'x' }));
    }
    await assertSucceeds(setDoc(doc(ctx.admin.firestore(), 'schedule', 'new'), { name: 'x' }));
  });
});

describe('/users', () => {
  test('an admin can get their own entry by UID', async () => {
    await assertSucceeds(getDoc(doc(ctx.admin.firestore(), 'users', ADMIN_UID)));
  });

  // The admin app's authorization check: getDoc(users/{uid}) must resolve (not be denied)
  // for a signed-in non-admin, so the app can read "no such document" and refuse access.
  test('a non-admin can get their own missing entry and sees that it does not exist', async () => {
    const snapshot = await assertSucceeds(
      getDoc(doc(ctx.outsider.firestore(), 'users', OUTSIDER_UID)),
    );
    assert.equal(snapshot.exists(), false);
  });

  test("an admin cannot get another admin's entry", async () => {
    await assertFails(getDoc(doc(ctx.admin.firestore(), 'users', SECOND_ADMIN_UID)));
  });

  test('signed-out visitors and non-admins cannot get any entry', async () => {
    await assertFails(getDoc(doc(ctx.anon.firestore(), 'users', ADMIN_UID)));
    await assertFails(getDoc(doc(ctx.outsider.firestore(), 'users', ADMIN_UID)));
  });

  test("an account whose token carries an admin's email cannot read that admin's entry", async () => {
    const spoof = testEnv.authenticatedContext('spoof-uid-000000000000', {
      email: ADMIN_EMAIL,
      email_verified: false,
    });
    await assertFails(getDoc(doc(spoof.firestore(), 'users', ADMIN_UID)));
    const byEmail = query(
      collection(spoof.firestore(), 'users'),
      where('email', '==', ADMIN_EMAIL),
    );
    await assertFails(getDocs(byEmail));
  });

  test('nobody can list or query the allowlist, admins included', async () => {
    for (const c of [ctx.anon, ctx.outsider, ctx.admin]) {
      await assertFails(getDocs(collection(c.firestore(), 'users')));
    }
    const ownEmail = query(
      collection(ctx.admin.firestore(), 'users'),
      where('email', '==', ADMIN_EMAIL),
    );
    await assertFails(getDocs(ownEmail));
  });

  test('a non-admin cannot self-promote by creating their own entry', async () => {
    await assertFails(
      setDoc(doc(ctx.outsider.firestore(), 'users', OUTSIDER_UID), { email: OUTSIDER_EMAIL }),
    );
  });

  test('admins cannot write entries either', async () => {
    const db = ctx.admin.firestore();
    await assertFails(setDoc(doc(db, 'users', OUTSIDER_UID), { email: OUTSIDER_EMAIL }));
    await assertFails(updateDoc(doc(db, 'users', ADMIN_UID), { email: ADMIN_EMAIL }));
    await assertFails(deleteDoc(doc(db, 'users', SECOND_ADMIN_UID)));
  });
});

describe('unmatched collections', () => {
  test('are denied to everyone, admins included', async () => {
    for (const c of [ctx.anon, ctx.outsider, ctx.admin]) {
      await assertFails(getDoc(doc(c.firestore(), 'bronze', 'any')));
      await assertFails(setDoc(doc(c.firestore(), 'bronze', 'any'), { name: 'x' }));
    }
  });

  test('include subcollections under public collections, admins included', async () => {
    for (const c of [ctx.anon, ctx.outsider, ctx.admin]) {
      const nested = doc(c.firestore(), 'gallery', 'published', 'notes', 'any');
      await assertFails(getDoc(nested));
      await assertFails(setDoc(nested, { name: 'x' }));
    }
  });
});
