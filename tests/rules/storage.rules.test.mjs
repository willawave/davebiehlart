import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteObject, getMetadata, ref, uploadBytes } from 'firebase/storage';
import { after, before, beforeEach, describe, test } from 'node:test';
import { contexts, setupTestEnv } from './helpers.mjs';

const BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const JPEG = { contentType: 'image/jpeg' };

// The only two prefixes the admin app uploads to.
const WRITABLE = ['gallery/key123/photo.jpg', 'statues/key123/photo.jpg'];

// Near-misses that must stay closed: the singular Firestore collection name, the
// wrong depth under a writable prefix, and an unrelated top-level folder.
const CLOSED = [
  'statue/key123/photo.jpg',
  'gallery/photo.jpg',
  'gallery/key123/nested/photo.jpg',
  'other/key123/photo.jpg',
];

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
    for (const path of [...WRITABLE, ...CLOSED]) {
      await uploadBytes(ref(c.storage(), path), BYTES, JPEG);
    }
  });
});

describe('reads', () => {
  test('anyone can read any object', async () => {
    for (const path of [...WRITABLE, ...CLOSED]) {
      await assertSucceeds(getMetadata(ref(ctx.anon.storage(), path)));
    }
  });
});

describe('writable prefixes', () => {
  for (const path of WRITABLE) {
    test(`admins can upload and delete ${path}`, async () => {
      await assertSucceeds(uploadBytes(ref(ctx.admin.storage(), path), BYTES, JPEG));
      await assertSucceeds(deleteObject(ref(ctx.admin.storage(), path)));
    });

    test(`signed-out visitors and non-admins cannot write ${path}`, async () => {
      for (const c of [ctx.anon, ctx.outsider]) {
        await assertFails(uploadBytes(ref(c.storage(), path), BYTES, JPEG));
        await assertFails(deleteObject(ref(c.storage(), path)));
      }
    });
  }
});

describe('everything else', () => {
  for (const path of CLOSED) {
    test(`nobody can write ${path}, admins included`, async () => {
      for (const c of [ctx.anon, ctx.outsider, ctx.admin]) {
        await assertFails(uploadBytes(ref(c.storage(), path), BYTES, JPEG));
        await assertFails(deleteObject(ref(c.storage(), path)));
      }
    });
  }
});
