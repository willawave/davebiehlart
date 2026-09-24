import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteObject, getMetadata, listAll, ref, uploadBytes } from 'firebase/storage';
import { after, before, beforeEach, describe, test } from 'node:test';
import { ADMIN_EMAIL, contexts, setupTestEnv } from './helpers.mjs';

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

// Must match the size limit in storage.rules.
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

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
  test('anyone can get any object', async () => {
    for (const path of [...WRITABLE, ...CLOSED]) {
      await assertSucceeds(getMetadata(ref(ctx.anon.storage(), path)));
    }
  });

  test('signed-out visitors and non-admins cannot list the bucket', async () => {
    for (const c of [ctx.anon, ctx.outsider]) {
      await assertFails(listAll(ref(c.storage(), 'gallery')));
      await assertFails(listAll(ref(c.storage(), 'gallery/key123')));
    }
  });

  test('admins can list', async () => {
    await assertSucceeds(listAll(ref(ctx.admin.storage(), 'gallery/key123')));
  });
});

describe('writable prefixes', () => {
  for (const path of WRITABLE) {
    test(`admins can upload and delete an image at ${path}`, async () => {
      await assertSucceeds(uploadBytes(ref(ctx.admin.storage(), path), BYTES, JPEG));
      await assertSucceeds(deleteObject(ref(ctx.admin.storage(), path)));
    });

    test(`admins can upload every allowed raster type to ${path}`, async () => {
      for (const contentType of ['image/png', 'image/webp', 'image/gif', 'image/avif']) {
        await assertSucceeds(uploadBytes(ref(ctx.admin.storage(), path), BYTES, { contentType }));
      }
    });

    test(`admins cannot upload non-images or SVG to ${path}`, async () => {
      for (const contentType of ['text/html', 'image/svg+xml', 'application/octet-stream']) {
        await assertFails(uploadBytes(ref(ctx.admin.storage(), path), BYTES, { contentType }));
      }
    });

    test(`the content type must match an allowed type exactly at ${path}`, async () => {
      for (const contentType of ['image/pngx', 'x-image/png', 'image/jpeg2000']) {
        await assertFails(uploadBytes(ref(ctx.admin.storage(), path), BYTES, { contentType }));
      }
    });

    test(`an account whose token carries an admin's email cannot write ${path}`, async () => {
      const spoof = testEnv.authenticatedContext('spoof-uid-000000000000', {
        email: ADMIN_EMAIL,
        email_verified: false,
      });
      await assertFails(uploadBytes(ref(spoof.storage(), path), BYTES, JPEG));
      await assertFails(deleteObject(ref(spoof.storage(), path)));
    });

    test(`admins can upload an image just under the limit to ${path}`, async () => {
      const justUnder = new Uint8Array(MAX_UPLOAD_BYTES - 1);
      await assertSucceeds(uploadBytes(ref(ctx.admin.storage(), path), justUnder, JPEG));
    });

    test(`admins cannot upload an image of ${MAX_UPLOAD_BYTES} bytes or more to ${path}`, async () => {
      const tooBig = new Uint8Array(MAX_UPLOAD_BYTES);
      await assertFails(uploadBytes(ref(ctx.admin.storage(), path), tooBig, JPEG));
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
