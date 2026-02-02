import type { CacheSchedules, DatabaseAdapter } from "../../types/express.js"
import logger from "../../logger.js"

// caches data in passed variable and returns it.
export default async function scheduleCacher(
  adapter: DatabaseAdapter,
  scheduleCache: CacheSchedules
) {
  logger.info("getting schedules..")
  let snap = await adapter.getAllSchedules()

  scheduleCache.expiry = Date.now() + 60000 * 5
  snap.forEach((sched) => {
    scheduleCache.schedules.push(sched)
  })
  logger.info("Schedules Cached.")
}
