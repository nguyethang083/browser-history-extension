import { openDB } from "idb"

const DB_NAME = "DailyReportDB"
const DB_VERSION = 1
const REPORTS_STORE = "reports"
const MESSAGES_STORE = "messages"

// Open or initialize the database
export const openIndexedDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create "reports" store if it doesn't exist
      if (!db.objectStoreNames.contains(REPORTS_STORE)) {
        db.createObjectStore(REPORTS_STORE, { keyPath: "date" })
      }

      // Create "messages" store if it doesn't exist
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        db.createObjectStore(MESSAGES_STORE, {
          keyPath: "id",
          autoIncrement: true
        })
      }
    }
  })
}

// Save a daily report to the "reports" store
export const saveDailyReport = async (date: string, report: any) => {
  const db = await openIndexedDB()
  await db.put(REPORTS_STORE, { date, report })
  return "Report saved successfully."
}

// Get a daily report from the "reports" store
export const getDailyReport = async (date: string) => {
  console.log("Getting daily report for date:", date)
  const db = await openIndexedDB()
  const result = await db.get(REPORTS_STORE, date)
  return result?.report || null
}

export const saveChatMessage = async (message: {
  type: string
  text: string
  timestamp: number
}) => {
  const db = await openIndexedDB()
  await db.add(MESSAGES_STORE, message)
  return "Message saved successfully."
}

export const getChatMessages = async () => {
  const db = await openIndexedDB()
  return await db.getAll(MESSAGES_STORE)
}

export const clearChatMessages = async () => {
  const db = await openIndexedDB()
  await db.clear(MESSAGES_STORE)
  return "Messages cleared successfully."
}
