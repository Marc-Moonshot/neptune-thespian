import type { Firestore } from "firebase-admin/firestore"
import type { CacheSchedules, Schedule } from "types/express.js"
import logger from "logger.ts"

// caches data in passed variable and returns it.
export default async function scheduleCacher(
  db: Firestore,
  scheduleCache: CacheSchedules
) {
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
