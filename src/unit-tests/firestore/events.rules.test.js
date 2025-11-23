import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';

/**
 * Firestore security rules tests for /events/{eventId} deletes.
 *
 * Scenarios:
 * - Host (event owner) can delete their own event.
 * - Chef/admin can delete any event.
 * - Non-owner cook cannot delete someone else's event.
 */

let testEnv;

const PROJECT_ID = 'demo-whosbringingwhat';

const loadRules = () => readFileSync('firestore.rules', 'utf8');

describe('Firestore rules - events delete', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: loadRules(),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  const seedEvent = async (eventId, data) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('events').doc(eventId).set(data);
    });
  };

  it('allows the host (event owner) to delete their own event', async () => {
    const hostId = 'host-user';
    const eventId = 'host-event';

    await seedEvent(eventId, {
      title: 'Host Event',
      createdById: hostId,
      hostId,
    });

    const hostDb = testEnv.authenticatedContext(hostId, { role: 'cook' }).firestore();
    const eventRef = hostDb.collection('events').doc(eventId);

    await assertSucceeds(eventRef.delete());
  });

  it('allows a chef/admin to delete any event', async () => {
    const hostId = 'regular-host';
    const chefId = 'chef-user';
    const eventId = 'chef-can-delete';

    await seedEvent(eventId, {
      title: 'Someone Else Event',
      createdById: hostId,
      hostId,
    });

    const chefDb = testEnv.authenticatedContext(chefId, { role: 'chef' }).firestore();
    const eventRef = chefDb.collection('events').doc(eventId);

    await assertSucceeds(eventRef.delete());
  });

  it("does not allow a non-owner cook to delete someone else's event", async () => {
    const hostId = 'real-host';
    const otherUserId = 'other-cook';
    const eventId = 'non-owner-event';

    await seedEvent(eventId, {
      title: 'Protected Event',
      createdById: hostId,
      hostId,
    });

    const otherDb = testEnv.authenticatedContext(otherUserId, { role: 'cook' }).firestore();
    const eventRef = otherDb.collection('events').doc(eventId);

    await assertFails(eventRef.delete());
  });

  it('allows the creator to delete when hostId is not set (createdById fallback)', async () => {
    const creatorId = 'creator-user';
    const eventId = 'creator-fallback-event';

    await seedEvent(eventId, {
      title: 'Creator Only Event',
      createdById: creatorId,
      // no hostId on purpose to exercise the fallback logic in isEventOwner
    });

    const creatorDb = testEnv.authenticatedContext(creatorId, { role: 'cook' }).firestore();
    const eventRef = creatorDb.collection('events').doc(eventId);

    await assertSucceeds(eventRef.delete());
  });
});
