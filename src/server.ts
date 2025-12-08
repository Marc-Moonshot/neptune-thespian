// firestore init /
// connect to firestore /
// read & cache schedules collection
// set control_data document based on schedule.value and schedule.time. do this check every n minutes
import db from "admin.ts"
import cors from "cors"
import express from "express"
const port = 3000
const app = express()

app.use(express.json())
app.use(cors())

app.listen(port, async () => {
  console.log(`Thespian running on port ${port}`)

  checkSchedules()
  if()
  setControlData()
})
