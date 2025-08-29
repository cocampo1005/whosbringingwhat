const functions = require('firebase-functions'); // v3.x
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

exports.setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }

  const { uid, role } = data || {};
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and role are required.');
  }
  if (!['cook', 'chef'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Role must be "cook" or "chef".');
  }

  // Caller must be a chef
  const callerRole = context.auth.token && context.auth.token.role;
  if (callerRole !== 'chef') {
    throw new functions.https.HttpsError('permission-denied', 'Chef only.');
  }

  // Optional: ensure target exists
  let target;
  try {
    target = await admin.auth().getUser(uid);
  } catch {
    throw new functions.https.HttpsError('not-found', 'Target user does not exist.');
  }

  // Optional: prevent demoting the last chef
  if (role === 'cook') {
    const list = await admin.auth().listUsers(1000);
    const chefCount = list.users.reduce((n, u) => n + (u.customClaims && u.customClaims.role === 'chef' ? 1 : 0), 0);
    const targetIsChef = target.customClaims && target.customClaims.role === 'chef';
    if (targetIsChef && chefCount <= 1) {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot demote the last remaining chef.');
    }
  }

  await admin.auth().setCustomUserClaims(uid, { role });

  await admin.firestore().doc(`users/${uid}`).set({
    role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid,
  }, { merge: true });

  await admin.firestore().collection('role_changes').add({
    uid,
    role,
    by: context.auth.uid,
    at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, uid, role };
});