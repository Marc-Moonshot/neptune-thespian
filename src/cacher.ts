import type { Firestore } from "firebase-admin/firestore"
import { pino } from "pino"
import type { CacheSchedules, Schedule } from "types/express.js"

// caches data in internal variable and returns it.
export default async function scheduleCacher(
  db: Firestore,
  scheduleCache: CacheSchedules
) {
  const logger = pino({
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true, // adds colors
        translateTime: "HH:MM:ss", // readable timestamps
        ignore: "pid,hostname" // optional: hide fields
      }
    }
  })
  let collection = db.collection("schedules")

  logger.info("getting schedules..")
  let snap = await collection.get()

  if (snap.empty) {
    throw new Error("'schedules' Collection Empty.")
  }

  scheduleCache.expiry = Date.now() + 60000 * 5
  snap.docs.forEach((doc) => {
    scheduleCache.schedules.push(doc.data() as Schedule)
  })
  logger.info("Schedules Cached.")
}
