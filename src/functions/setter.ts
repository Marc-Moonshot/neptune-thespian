import type { DocumentReference, Firestore } from "firebase-admin/firestore"
import logger from "logger.ts"
import type { DeviceControlData, Log } from "types/express.js"

// sets the DeviceControlData document's control_value field to the parameter passed.
// must create entry in logs collection by "SYSTEM"
export default async function setter(
  db: Firestore,
  updates: { value: number; docRef: DocumentReference }[]
) {
  const logCollection = db.collection("logs")
  for (const update of updates) {
    try {
      const snap = await update.docRef.get()
      const data = snap.data() as DeviceControlData
      const newControlData = data
      newControlData.control_values[0] = update.value.toString()

      await update.docRef.update(newControlData)

      const newLog: Log = {
        deviceId: Number.parseInt(data.device_id),
        date: Date.now(),
        field: "control_value",
        lastValue: data.control_values[0]!,
        setValue: newControlData.control_values[0],
        userEmail: "SYSTEM",
        userId: "SYSTEM",
        username: "SYSTEM"
      }
      await logCollection.add(newLog)
    } catch (err) {
      logger.error(err)
    }
  }
}
