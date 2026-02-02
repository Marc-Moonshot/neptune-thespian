import type { DocumentReference } from "firebase-admin/firestore"

export type Schedule = {
  time: number
  value: number
  controlMode?: "AUTO" | "MANUAL"
  controlOn?: boolean
  created_at: number
  created_by_email: string
  created_by_id: string
  device_id: number
  updated_at: number
}

export type DeviceControlData = {
  control_values: string[]
  current_values: string[]
  device_id: number
  last_contact: string
  live: boolean
  status: string
}

type Device = {
  id: string
  device_number: number
  nickname: string
  last_status: "OK" | "ERROR" | "DISABLED"
  last_contact: number
  date_registered: number
  rtu_assigned: number
  device_type: "DOSING_PUMP" | "VALVE" | "RELAY"
  device_code: string
  live?: boolean
  units?: string[]
}

export type CacheSchedules = {
  expiry: number
  schedules: Schedule[]
}

type Log = {
  deviceId: number
  field: string
  lastValue: string | number
  setValue: string | number
  date: number
  username: string
  userEmail: string
  userId: string
}

type DatabaseAdapter = {
  getAllSchedules(): Promise<Schedule[]>
  getControlDataByDeviceId(deviceId: number): Promise<DeviceControlData[]>
  getIoDeviceById(deviceId: number): Promise<Device>
  addLogs(logs: Log[]): Promise<void>
  getControlDataDocRef(deviceId: number): Promise<DocumentReference>
  runTransaction<T>(
    callback: (ctx: transactionContext) => Promise<T>
  ): Promise<T>
}

type transactionContext = {
  get<T>(ref: any): Promise<T | null>
  update(ref: any, data: any): Promise<void>
}
