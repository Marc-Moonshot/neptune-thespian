import type { Firestore } from "firebase-admin/firestore"
import type { CacheSchedules, DeviceControlData } from "../types/express.js"
import logger from "../logger.js"

// checks if a schedule has not been reflected in a device's control_data and returns them. (to be consumed by setter())
export default async function scheduleMatcher(
  db: Firestore,
  scheduleCache: CacheSchedules
) {
  const collection = db.collection("control_data")

  const matchingSchedulesNow = scheduleCache.schedules.filter((schedule) => {
    // Get current time in PH timezone
    const nowInPH = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })
    )

    // Get today's date at midnight in PH timezone
    const todayPH = new Date(nowInPH.toDateString())

    // Calculate schedule time in PH timezone (midnight + schedule.time minutes)
    const scheduleMs = todayPH.getTime() + schedule.time * 60_000
    const scheduleMinute = Math.floor(scheduleMs / 60_000) * 60_000

    // Get current minute in PH timezone
    const minuteNow = Math.floor(nowInPH.getTime() / 60_000) * 60_000

    logger.info({
      minuteNow: new Date(minuteNow).toTimeString(),
      scheduleMinute: new Date(scheduleMinute).toTimeString()
    })

    return scheduleMinute === minuteNow
  })

  if (matchingSchedulesNow.length == 0) {
    logger.warn("no matching schedules this minute.")
    return []
  }
  logger.info(
    `Found ${matchingSchedulesNow.length} schedules for current minute`
  )

  const promises = matchingSchedulesNow.map(async (schedule) => {
    try {
      const controlDataSnap = await collection
        .where("device_id", "==", schedule.device_id)
        .get()

      if (controlDataSnap.empty) {
        logger.warn(`no control data document found for ${schedule.device_id}.`)
        return []
      }

      const updates = []

      for (const doc of controlDataSnap.docs) {
        const data = doc.data() as DeviceControlData
        const updatesForDoc: any = {
          docRef: doc.ref
        }

        let hasChanges = false

        // if dosing pump, control_value[1] should be set to value
        // otherwise control_value[0] should be used
        if (schedule.value.toString() !== data.control_values[0]) {
          updatesForDoc.value = schedule.value
          hasChanges = true
        }

        if (
          schedule.controlMode !== undefined &&
          schedule.controlMode.toString() !== data.control_values[1]
        ) {
          updatesForDoc.mode = schedule.controlMode.toString()
          hasChanges = true
        }

        if (data.control_values[2]) {
          const control_value_on =
            parseInt(data.control_values[2]) === 0 ? false : true

          if (
            schedule.controlOn !== undefined &&
            schedule.controlOn !== control_value_on
          ) {
            updatesForDoc.on = schedule.controlOn
            hasChanges = true
          }
        }

        if (hasChanges) {
          logger.info(
            `Device ${data.device_id} is out of sync. Queueing updates.`
          )
          updates.push(updatesForDoc)
        }
      }

      return updates
    } catch (err) {
      logger.error(err)
      return []
    }
  })
  const results = await Promise.all(promises)
  return results.flat()
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
