// firestore init /
// connect to firestore /
// schedule caching function /
// schedule matcher function /
// control data actor function /

import db from "./admin.js"
import scheduleCacher from "./functions/cacher.js"
import cors from "cors"
import express from "express"
import type { CacheSchedules } from "./types/express.js"
import scheduleMatcher from "./functions/matcher.js"
import setter from "./functions/setter.js"
import logger from "./logger.js"

const port = 3000

const app = express()
app.use(express.json())
app.use(cors())

logger.info(`Thespian running on port ${port}`)
let scheduleCache: CacheSchedules = { expiry: 0, schedules: [] }

const runSchedules = async () => {
  try {
    if (scheduleCache.expiry < Date.now()) {
      logger.warn("cache expired.")
      scheduleCache.schedules = []
      await scheduleCacher(db, scheduleCache)
    } else {
      logger.info("cache valid.")
    }

    const matches = await scheduleMatcher(db, scheduleCache)
    if (matches.length) {
      console.log(`matches: `)
      matches.forEach((match) => logger.info(match))

      await setter(db, matches)
    }
  } catch (err) {
    logger.error(err)
  }
}

await runSchedules()
const callback = setInterval(runSchedules, 60000)

process.on("SIGINT", () => {
  logger.info("Stopping Thespian gracefully..")
  clearInterval(callback)
  process.exit(0)
})

process.on("SIGTERM", () => {
  logger.info("Stopping Thespian gracefully..")
  clearInterval(callback)
  process.exit(0)
})
