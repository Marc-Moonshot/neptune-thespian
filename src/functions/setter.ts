import type { DocumentReference, Firestore } from "firebase-admin/firestore"
import logger from "logger.ts"

// sets the DeviceControlData document's control_value field to the parameter passed.
export default async function setter(
  db: Firestore,
  updates: { value: number; docRef: DocumentReference }[]
) {
  for (const update of updates) {
  }
}
