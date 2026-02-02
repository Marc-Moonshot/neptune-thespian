import logger from "../../logger.js"
import type {
  DatabaseAdapter,
  DeviceControlData,
  Log
} from "../../types/express.js"

export default async function setter(
  adapter: DatabaseAdapter,
  updates: {
    value: number
    deviceId: number
    mode: string | undefined
    on: 0 | 1 | undefined
  }[]
) {
  await adapter.runTransaction(async (transaction) => {
    for (const update of updates) {
      try {
        const deviceQuery = await adapter.getControlDataByDeviceId(
          update.deviceId
        )

        if (deviceQuery[0] === undefined)
          throw new Error(`device ${update.deviceId} does not exist.`)

        const data = deviceQuery[0]

        const defaultControlValue = data.control_values[0] // most devices use index 0 for value
        const pumpControlValue = data.control_values[1] // dosing pumps use index 1
        const pumpModeValue = data.control_values[0] // dosing pump devices have the mode field at index 0
        const pumpOnValue = data.control_values[2]

        const ioDevice = await adapter.getIoDeviceById(data.device_id)

        const deviceType = ioDevice.device_type

        logger.info(`device type: ${deviceType}`)

        const newControlData = structuredClone(data)

        // TODO: please for the love of god rewrite this sometime soon
        if (deviceType === "DOSING_PUMP") {
          if (update.value != undefined) {
            newControlData.control_values[1] = update.value.toString()
            logger.info(
              `updated ${data.device_id}'s value field from ${pumpControlValue} to ${newControlData.control_values[1]}`
            )
          }
        } else {
          newControlData.control_values[0] = update.value.toString()
          logger.info(
            `updated ${data.device_id}'s value field from ${defaultControlValue} to ${newControlData.control_values[0]}`
          )
        }

        if (update.mode != undefined) {
          newControlData.control_values[0] = update.mode.toString()
          logger.info(
            `updated ${data.device_id}'s mode field from ${pumpModeValue} to ${newControlData.control_values[0]}`
          )
        }
        if (update.on != undefined) {
          newControlData.control_values[2] = update.on.toString()

          logger.info(
            `updated ${data.device_id}'s on field from ${pumpOnValue} to ${newControlData.control_values[2]}`
          )
        }

        const docRef = await adapter.getControlDataDocRef(update.deviceId)

        transaction.update(docRef, newControlData)

        logger.info(newControlData)
        const logs: Log[] = createLogs({
          data: data,
          deviceType: deviceType,
          newControlData,
          update: update
        })

        await adapter.addLogs(logs)
      } catch (err) {
        logger.error(err)
      }
    }
  })
}

// creates logs for the changes that have been made by the service
const createLogs = ({
  deviceType,
  newControlData,
  data,
  update
}: {
  deviceType: string
  newControlData: DeviceControlData
  data: DeviceControlData
  update: {
    value: number
    deviceId: number
    mode: string | undefined
    on: 0 | 1 | undefined
  }
}) => {
  const logs: Log[] = []
  switch (deviceType) {
    case "DOSING_PUMP": {
      if (update.mode != undefined)
        logs.push({
          deviceId: data.device_id,
          date: Date.now(),
          field: "control_mode",
          lastValue: data.control_values[0]!,
          setValue: newControlData.control_values[0]!,
          userEmail: "SYSTEM",
          userId: "SYSTEM",
          username: "SYSTEM"
        })
      if (update.value != undefined)
        logs.push({
          deviceId: data.device_id,
          date: Date.now(),
          field: "control_value",
          lastValue: data.control_values[1]!,
          setValue: newControlData.control_values[1]!,
          userEmail: "SYSTEM",
          userId: "SYSTEM",
          username: "SYSTEM"
        })

      if (update.on != undefined)
        logs.push({
          deviceId: data.device_id,
          date: Date.now(),
          field: "control_on",
          lastValue: data.control_values[2]!,
          setValue: newControlData.control_values[2]!,
          userEmail: "SYSTEM",
          userId: "SYSTEM",
          username: "SYSTEM"
        })
      break
    }

    default: {
      if (newControlData.control_values[0])
        logs.push({
          deviceId: data.device_id,
          date: Date.now(),
          field: "control_value",
          lastValue: data.control_values[0]!,
          setValue: newControlData.control_values[0],
          userEmail: "SYSTEM",
          userId: "SYSTEM",
          username: "SYSTEM"
        })
    }
  }

  return logs
}
