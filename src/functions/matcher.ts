import type { DocumentReference, Firestore } from "firebase-admin/firestore"
import { pino } from "pino"
import type { CacheSchedules, DeviceControlData } from "types/express.js"

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname"
    }
  }
})

export type pendingUpdates = {
  value: number
  docRef: DocumentReference
}[]

// checks if a schedule has not been reflected in a device's control_data and returns them. (to be consumed by setter())
export default async function scheduleMatcher(
  db: Firestore,
  scheduleCache: CacheSchedules
) {
  let docsToBeUpdated: pendingUpdates = []

  const collection = db.collection("control_data")

  for (const schedule of scheduleCache.schedules) {
    try {
      const controlDataSnap = await collection
        .where("device_id", "==", schedule.device_id)
        .get()

      if (controlDataSnap.empty) {
        logger.warn(`no control data document found for ${schedule.device_id}.`)
        continue
      }

      const scheduleMinute = Math.floor(schedule.time / 60_000) * 60_000 // round value down to the minute
      const minuteNow = Math.floor(Date.now() / 60_000) * 60_000

      if (scheduleMinute === minuteNow) {
        for (const doc of controlDataSnap.docs) {
          const data = doc.data() as DeviceControlData

          if (schedule.value.toString() !== data.control_values[0]) {
            docsToBeUpdated.push({ value: schedule.value, docRef: doc.ref })
          }
        }
      }
      // for (const doc of controlDataSnap.docs) {
      //   const data = doc.data() as DeviceControlData
      //   if (schedule.value.toString() !== data.control_values[0]) {
      //     const newControlValue = [
      //       schedule.value.toString(),
      //       data.control_values[1] ?? "0",
      //       data.control_values[2] ?? "0"
      //     ]
      //     await doc.ref.update({ control_values: newControlValue })

      //     logger.info(
      //       {
      //         device_id: schedule.device_id,
      //         old_values: data.control_values,
      //         new_values: newControlValue
      //       },
      //       "Updated control values"
      //     )
      //   }
      // }
    } catch (err) {
      logger.error(err)
    }

    return docsToBeUpdated
  }
}
