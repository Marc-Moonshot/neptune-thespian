import type {
  CacheSchedules,
  DatabaseAdapter,
  Device
} from "../../types/express.js"
import logger from "../../logger.js"

// checks if a schedule has not been reflected in a device's control_data and returns them. (to be consumed by setter())
export default async function scheduleMatcher(
  adapter: DatabaseAdapter,
  scheduleCache: CacheSchedules
) {
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

    return Math.abs(scheduleMinute - minuteNow) < 30_000 // tolerance
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
      const controlData = await adapter.getControlDataByDeviceId(
        schedule.device_id
      )

      const updates = []

      for (const data of controlData) {
        const updatesForDoc: any = {
          deviceId: data.device_id
        }

        let hasChanges = false

        const ioDevice = await adapter.getIoDeviceById(data.device_id)

        // if dosing pump, control_value[1] should be set to value
        // otherwise control_value[0] should be used
        if (ioDevice.device_type === "DOSING_PUMP") {
          if (schedule.value.toString() !== data.control_values[1]) {
            updatesForDoc.value = schedule.value
            hasChanges = true
            logger.info(
              `Device ${data.device_id}'s value field is out of sync. Queueing updates.`
            )
          }
          if (
            schedule.controlMode !== undefined &&
            schedule.controlMode.toString() !== data.control_values[0]
          ) {
            updatesForDoc.mode = schedule.controlMode.toString()
            hasChanges = true
            logger.info(
              `Device ${data.device_id}'s mode field is out of sync. Queueing updates.`
            )
          }

          if (data.control_values[2]) {
            const control_value_on =
              parseInt(data.control_values[2]) === 0 ? false : true

            logger.info(`control_value_on: ${control_value_on}`)
            logger.info(`schedule.controlOn: ${schedule.controlOn}`)
            if (
              schedule.controlOn !== undefined &&
              schedule.controlOn !== control_value_on
            ) {
              updatesForDoc.on = schedule.controlOn === false ? 0 : 1
              hasChanges = true
              logger.info(
                `Device ${data.device_id}'s on field is out of sync. Queueing updates.`
              )
            }
          }
        } else {
          if (schedule.value.toString() !== data.control_values[0]) {
            updatesForDoc.value = schedule.value
            hasChanges = true
            logger.info(
              `Device ${data.device_id}'s value field is out of sync. Queueing updates.`
            )
          }
        }

        if (hasChanges) {
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
