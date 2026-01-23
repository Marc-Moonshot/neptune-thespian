export type Schedule = {
  time: number
  value: number
  created_at: number
  created_by_email: string
  created_by_id: string
  device_id: number
  updated_at: number
}

export type DeviceControlData = {
  control_values: string[]
  current_values: string[]
  device_id: string
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
  device_type: string
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
