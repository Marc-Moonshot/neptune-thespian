// factory that returns implementations of the functions defined in DatabaseAdapter
import {
  DocumentReference,
  type DocumentData,
  type Firestore
} from "firebase-admin/firestore"
import type {
  DatabaseAdapter,
  Device,
  DeviceControlData,
  Log,
  Schedule,
  transactionContext
} from "../types/express.js"

export function createFirestoreAdapter(db: Firestore): DatabaseAdapter {
  const getAllSchedules = async (): Promise<Schedule[]> => {
    const snap = await db.collection("schedules").get()

    if (snap.empty) {
      throw new Error("'schedules' Collection Empty.")
    }

    return snap.docs.map((doc) => doc.data() as Schedule)
  }
  const getControlDataByDeviceId = async (
    deviceId: number
  ): Promise<DeviceControlData[]> => {
    const controlDataSnap = await db
      .collection("control_data")
      .where("device_id", "==", deviceId)
      .get()

    if (controlDataSnap.empty)
      throw new Error(`no control data for device ${deviceId}`)

    return controlDataSnap.docs.map((doc) => doc.data() as DeviceControlData)
  }

  const getIoDeviceById = async (deviceId: number): Promise<Device> => {
    const ioDevices = await db
      .collection("io_devices")
      .where("device_number", "==", deviceId)
      .get()

    const [doc] = ioDevices.docs
    if (!doc) throw new Error(`Io Device ${deviceId} does not exist.`)
    return doc.data() as Device
  }

  const addLogs = async (logs: Log[]): Promise<void> => {
    const batch = db.batch()

    logs.map((log) => {
      batch.create(db.collection("logs").doc(), log)
    })

    await batch.commit()
  }
  const getControlDataDocRef = async (
    docId: number
  ): Promise<DocumentReference> => {
    const snap = await db
      .collection("control_data")
      .where("device_id", "==", docId)
      .get()
    if (snap.docs[0] === undefined) throw new Error("no control data found.")
    return snap.docs[0].ref
  }

  async function runTransaction<T>(
    callback: (ctx: transactionContext) => Promise<T>
  ): Promise<T> {
    return db.runTransaction(async (transaction) => {
      const ctx: transactionContext = {
        get: async <T>(ref: DocumentReference): Promise<T | null> => {
          const snap = await transaction.get(ref)
          return snap.exists ? (snap.data() as T) : null
        },
        update: async (ref: DocumentReference, data: any): Promise<void> => {
          transaction.update(ref, data)
        }
      }
      return callback(ctx)
    })
  }

  return {
    getAllSchedules,
    getControlDataByDeviceId,
    getIoDeviceById,
    addLogs,
    getControlDataDocRef,
    runTransaction
  }
}
