const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.app.length) admin.initializeApp();

exports.setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }

  const { uid, role } = data || {};
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and role are required');
  }

  if (!['cook','chef'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Role must be "cook" or "chef".');
  }

  const callerRole = context.auth.token && context.auth.token.role;
  if (callerRole !== 'chef') {
    throw new functions.https.HttpsError('permission-denied', 'Chef only.');
  }

  await admin.auth().setCustomUserClaims(uid, { role });

  await admin.firestore().doc(`users/${uid}`).set({
    role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid,
  }, { merge: true });

  return { ok: true, uid, role }
});
