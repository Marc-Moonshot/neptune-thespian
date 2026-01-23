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
    on: boolean | undefined
  }[]
) {
  const logCollection = db.collection("logs")
  for (const update of updates) {
    try {
      update.docRef.get()
      const snap = await update.docRef.get()
      const data = snap.data() as DeviceControlData

      const ioDevices = await db
        .collection("io_devices")
        .where("device_number", "==", data.device_id)
        .get()

      const ioDevice = ioDevices.docs[0]?.data() as Device

      const deviceType = ioDevice.device_type

      console.log("device type:", deviceType)

      const newControlData = structuredClone(data)
      newControlData.control_values[0] = update.value.toString()
      newControlData.control_values[1] = update.mode.toString()
      newControlData.control_values[2] = update.on.toString()

      const logs: Log[] = []

      // normal devices can only change control_value field
      if (deviceType !== "DOSING_PUMP")
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

      // dosing pumps can change mode, on and value
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

      await update.docRef.update(newControlData)
      logger.info(
        `updated ${data.device_id}'s value from ${data.control_values[0]} to ${newControlData.control_values[0]}`
      )

      for (const log of logs) {
        await logCollection.add(log)
      }
    } catch (err) {
      logger.error(err)
    }
  }
}
