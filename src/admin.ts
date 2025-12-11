import { cert, getApps, initializeApp, type App } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { readFileSync } from "fs"
import "dotenv/config"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

console.log("Initializing Firebase..")
const __dirname = dirname(fileURLToPath(import.meta.url))

const secretPath =
  process.env.NODE_ENV === "production"
    ? "/run/secrets/firebase_admin"
    : join(__dirname, "..", "secrets", "admin.json")

const app = getApps().length
  ? (getApps()[0] as App)
  : initializeApp({
      credential: cert(JSON.parse(readFileSync(secretPath, "utf8")))
    })

// Initialize Firestore
const db = getFirestore(app)
console.log("Firebase Initialized.")
export default db
