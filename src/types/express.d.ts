export type Schedule = {
  time: number
  value: number
}

export type DeviceControlData = {
  control_values: string[]
  current_values: string[]
  device_id: string
  last_contact: string
  live: boolean
  status: string
}
