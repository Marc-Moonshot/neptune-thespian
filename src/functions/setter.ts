import type { DocumentReference, Firestore } from "firebase-admin/firestore"
import logger from "../logger.js"
import type { Device, DeviceControlData, Log } from "../types/express.js"
import type { firestore } from "firebase-admin"
import type { Database } from "firebase-admin/database"

// sets the DeviceControlData document's fields to the parameter passed.
// must create entry in logs collection by "SYSTEM"
export default async function setter(
  db: Firestore,
  updates: {
    value: number
    docRef: DocumentReference
    mode: string | undefined
    on: boolean | undefined
  }[]
) {
  await db.runTransaction(async (transaction) => {
    for (const update of updates) {
      try {
        const snap = await transaction.get(update.docRef)
        const data = snap.data() as DeviceControlData

        const ioDevices = await db
          .collection("io_devices")
          .where("device_number", "==", data.device_id)
          .get()

        const ioDevice = ioDevices.docs[0]?.data() as Device

        const deviceType = ioDevice.device_type

        logger.info(`device type: ${deviceType}`)

        const newControlData = structuredClone(data)

        // TODO: please for the love of god rewrite this sometime soon
        if (deviceType === "DOSING_PUMP") {
          newControlData.control_values[1] = update.value.toString() // dosing pumps use index 1 for value
          logger.info(
            `updated ${data.device_id}'s value field from ${data.control_values[1]} to ${newControlData.control_values[1]}`
          )
        } else {
          newControlData.control_values[0] = update.value.toString() // other devices use index 0
          logger.info(
            `updated ${data.device_id}'s value field from ${data.control_values[0]} to ${newControlData.control_values[0]}`
          )
        }

        if (update.mode) {
          newControlData.control_values[0] = update.mode.toString() // dosing pump devices have the mode field in index 0
          logger.info(
            `updated ${data.device_id}'s mode field from ${data.control_values[0]} to ${newControlData.control_values[0]}`
          )
        }
        if (update.on) {
          newControlData.control_values[2] = update.on.toString()

          logger.info(
            `updated ${data.device_id}'s on field from ${data.control_values[2]} to ${newControlData.control_values[2]}`
          )
        }

        transaction.update(update.docRef, newControlData)

        logger.info(
          `updated ${data.device_id}'s value from ${data.control_values[0]} to ${newControlData.control_values[0]}`
        )

        const logCollection = db.collection("logs")

        const logs: Log[] = createLogs({
          data: data,
          deviceType: deviceType,
          newControlData
        })

        transaction.update(update.docRef, newControlData)
        logger.info(
          `updated ${data.device_id}'s value from ${data.control_values[0]} to ${newControlData.control_values[0]}`
        )

        await Promise.all(logs.map((log) => logCollection.add(log)))
      } catch (err) {
        logger.error(err)
      }
    }
  })
}

// creates logs and returns them
const createLogs = ({
  deviceType,
  newControlData,
  data
}: {
  deviceType: string
  newControlData: DeviceControlData
  data: DeviceControlData
}) => {
  const logs: Log[] = []
  switch (deviceType) {
    case "DOSING_PUMP": {
      if (newControlData.control_values[0])
        logs.push({
          deviceId: Number.parseInt(data.device_id),
          date: Date.now(),
          field: "control_mode",
          lastValue: data.control_values[0]!,
          setValue: newControlData.control_values[0],
          userEmail: "SYSTEM",
          userId: "SYSTEM",
          username: "SYSTEM"
        })
      if (newControlData.control_values[1])
        logs.push({
          deviceId: Number.parseInt(data.device_id),
          date: Date.now(),
          field: "control_value",
          lastValue: data.control_values[1]!,
          setValue: newControlData.control_values[1],
          userEmail: "SYSTEM",
          userId: "SYSTEM",
          username: "SYSTEM"
        })

      if (newControlData.control_values[2])
        logs.push({
          deviceId: Number.parseInt(data.device_id),
          date: Date.now(),
          field: "control_on",
          lastValue: data.control_values[2]!,
          setValue: newControlData.control_values[2],
          userEmail: "SYSTEM",
          userId: "SYSTEM",
          username: "SYSTEM"
        })
    }

    default: {
      if (newControlData.control_values[0])
        logs.push({
          deviceId: Number.parseInt(data.device_id),
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
