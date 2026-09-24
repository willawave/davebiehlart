import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  ADMIN_EMAIL,
  ADMIN_UID,
  CONTENT_COLLECTIONS,
  OUTSIDER_EMAIL,
  OUTSIDER_UID,
  SECOND_ADMIN_UID,
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
    for (const name of CONTENT_COLLECTIONS) {
      await setDoc(doc(c.firestore(), name, 'existing'), { name: 'seed', visible: false });
    }
  });
});

for (const name of CONTENT_COLLECTIONS) {
  describe(`/${name}`, () => {
    test('anyone can read, including hidden documents', async () => {
      await assertSucceeds(getDoc(doc(ctx.anon.firestore(), name, 'existing')));
      await assertSucceeds(getDoc(doc(ctx.outsider.firestore(), name, 'existing')));
    });

    test('signed-out visitors cannot write', async () => {
      await assertFails(setDoc(doc(ctx.anon.firestore(), name, 'new'), { name: 'x' }));
      await assertFails(updateDoc(doc(ctx.anon.firestore(), name, 'existing'), { name: 'x' }));
      await assertFails(deleteDoc(doc(ctx.anon.firestore(), name, 'existing')));
    });

    test('signed-in non-admins cannot write', async () => {
      const db = ctx.outsider.firestore();
      await assertFails(setDoc(doc(db, name, 'new'), { name: 'x' }));
      await assertFails(updateDoc(doc(db, name, 'existing'), { name: 'x' }));
      await assertFails(deleteDoc(doc(db, name, 'existing')));
    });

    test('admins can create, update, and delete', async () => {
      const db = ctx.admin.firestore();
      await assertSucceeds(setDoc(doc(db, name, 'new'), { name: 'x' }));
      await assertSucceeds(updateDoc(doc(db, name, 'existing'), { name: 'y' }));
      await assertSucceeds(deleteDoc(doc(db, name, 'existing')));
    });
  });
}

describe('/users', () => {
  test('an admin can read their own entry', async () => {
    await assertSucceeds(getDoc(doc(ctx.admin.firestore(), 'users', ADMIN_UID)));
  });

  test("an admin cannot read another admin's entry", async () => {
    await assertFails(getDoc(doc(ctx.admin.firestore(), 'users', SECOND_ADMIN_UID)));
  });

  test('signed-out visitors and non-admins cannot read any entry', async () => {
    await assertFails(getDoc(doc(ctx.anon.firestore(), 'users', ADMIN_UID)));
    await assertFails(getDoc(doc(ctx.outsider.firestore(), 'users', ADMIN_UID)));
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
});
