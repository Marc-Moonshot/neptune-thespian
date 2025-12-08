import { cert, getApps, initializeApp, type App } from "firebase-admin/app"
import serviceAccount from "../secrets/admin.json" with { type: "json" }
import admin, { type ServiceAccount } from "firebase-admin"
import { getFirestore } from "firebase-admin/firestore"

console.log("Initializing Firebase..")

const app = getApps().length
  ? (getApps()[0] as App)
  : initializeApp({
      credential: cert(serviceAccount as ServiceAccount)
    })

// Initialize Firestore
const db = getFirestore(app)
console.log("Firebase Initialized.")
export default db
