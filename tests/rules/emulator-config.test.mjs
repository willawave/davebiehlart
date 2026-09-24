// Guards against port drift: the app connects to emulator ports hardcoded in core, while
// the emulators (and this suite) read them from firebase.json. They must stay equal.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const { emulators } = JSON.parse(readFileSync('firebase.json', 'utf8'));
const providers = readFileSync('projects/core/src/lib/firebase/firebase.providers.ts', 'utf8');

function constant(name) {
  const match = providers.match(new RegExp(`export const ${name} = (\\d+);`));
  assert.ok(match, `${name} not found in firebase.providers.ts`);
  return Number(match[1]);
}

describe('emulator ports', () => {
  test('core constants match firebase.json', () => {
    assert.equal(constant('AUTH_EMULATOR_PORT'), emulators.auth.port);
    assert.equal(constant('FIRESTORE_EMULATOR_PORT'), emulators.firestore.port);
    assert.equal(constant('STORAGE_EMULATOR_PORT'), emulators.storage.port);
  });
});
