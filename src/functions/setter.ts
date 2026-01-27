import type { DocumentReference, Firestore } from "firebase-admin/firestore"
import logger from "../logger.js"
import type { Device, DeviceControlData, Log } from "../types/express.js"

// sets the DeviceControlData document's fields to the parameter passed.
// must create entry in logs collection by "SYSTEM"
export default async function setter(
  db: Firestore,
  updates: {
    value: number
    docRef: DocumentReference
    mode: string | undefined
    on: 0 | 1 | undefined
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
          if (update.value != undefined) {
            newControlData.control_values[1] = update.value.toString() // dosing pumps use index 1 for value
            logger.info(
              `updated ${data.device_id}'s value field from ${data.control_values[1]} to ${newControlData.control_values[1]}`
            )
          }
        } else {
          newControlData.control_values[0] = update.value.toString() // other devices use index 0
          logger.info(
            `updated ${data.device_id}'s value field from ${data.control_values[0]} to ${newControlData.control_values[0]}`
          )
        }

        if (update.mode != undefined) {
          newControlData.control_values[0] = update.mode.toString() // dosing pump devices have the mode field in index 0
          logger.info(
            `updated ${data.device_id}'s mode field from ${data.control_values[0]} to ${newControlData.control_values[0]}`
          )
        }
        if (update.on != undefined) {
          newControlData.control_values[2] = update.on.toString()

          logger.info(
            `updated ${data.device_id}'s on field from ${data.control_values[2]} to ${newControlData.control_values[2]}`
          )
        }

        transaction.update(update.docRef, newControlData)

        const logCollection = db.collection("logs")

        logger.info(newControlData)
        const logs: Log[] = createLogs({
          data: data,
          deviceType: deviceType,
          newControlData,
          update: update
        })

        transaction.update(update.docRef, newControlData)

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
  data,
  update
}: {
  deviceType: string
  newControlData: DeviceControlData
  data: DeviceControlData
  update: {
    value: number
    docRef: DocumentReference<
      FirebaseFirestore.DocumentData,
      FirebaseFirestore.DocumentData
    >
    mode: string | undefined
    on: 0 | 1 | undefined
  }
}) => {
  const logs: Log[] = []
  switch (deviceType) {
    case "DOSING_PUMP": {
      if (update.mode)
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
      if (update.value)
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

      if (update.on)
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
      break
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
