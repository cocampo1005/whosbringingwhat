// src/utils/storageCleanup.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";

/**
 * Best-effort cleanup of all images associated with items in an event.
 * - Deletes any image referenced by item.imageUrl (download URL or path).
 * - Also sweeps the item folder (item-images/<itemId>/...) in case of extras.
 */
export async function deleteAllEventItemImages(eventId) {
  const storage = getStorage();

  // 1) Load the event doc to get the embedded items array
  const eventRef = doc(db, "events", eventId);
  const snap = await getDoc(eventRef);
  if (!snap.exists()) return;

  const items = Array.isArray(snap.data()?.items) ? snap.data().items : [];

  // 2) For each item, try:
  //    a) delete the direct imageUrl (works for https, gs://, or fullPath)
  //    b) sweep item-images/<itemId>/ for any leftovers
  const deletions = [];

  const safeDeleteRef = async (r) => {
    try {
      await deleteObject(r);
    } catch (_) {
      /* ignore */
    }
  };

  for (const it of items) {
    // a) Delete the referenced image if present
    if (it?.imageUrl) {
      try {
        const fileRef = ref(storage, it.imageUrl); // url or path both OK
        deletions.push(safeDeleteRef(fileRef));
      } catch {
        /* ignore bad refs */
      }
    }

    // b) Best-effort sweep of the item's folder
    // Your uploads go to: item-images/<itemId>/<filename>
    if (it?.id) {
      try {
        const folderRef = ref(storage, `item-images/${it.id}`);
        const walk = async (folder) => {
          const res = await listAll(folder);
          await Promise.all([
            ...res.items.map((i) => safeDeleteRef(i)),
            ...res.prefixes.map((p) => walk(p)),
          ]);
        };
        deletions.push(walk(folderRef));
      } catch {
        /* listing might fail due to rules or not exist — ignore */
      }
    }
  }

  await Promise.allSettled(deletions);
}
