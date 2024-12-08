import { createRxDatabase } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"

const DB_NAME = "ChatDB"
const MESSAGES_COLLECTION = "messages"
const VECTOR_COLLECTION = "vector"
const REPORTS_COLLECTION = "reports"

const initializeDatabase = async () => {
  // Initialize the database
  const db = await createRxDatabase({
    name: DB_NAME,
    storage: getRxStorageDexie(),
    ignoreDuplicate: true // Add this option to ignore duplicate database creation
  })

  await db.addCollections({
    [MESSAGES_COLLECTION]: {
      schema: {
        version: 0,
        primaryKey: "id",
        type: "object",
        properties: {
          id: {
            type: "string",
            maxLength: 20
          },
          type: {
            type: "string"
          },
          text: {
            type: "string"
          },
          timestamp: {
            type: "number"
          }
        },
        required: ["id", "type", "text", "timestamp"]
      }
    },
    [VECTOR_COLLECTION]: {
      schema: {
        version: 0,
        primaryKey: "id",
        type: "object",
        properties: {
          id: {
            type: "string",
            maxLength: 20
          },
          embedding: {
            type: "array",
            items: {
              type: "string"
            }
          }
        },
        required: ["id", "embedding"]
      }
    },
    [REPORTS_COLLECTION]: {
      schema: {
        version: 0,
        primaryKey: "date",
        type: "object",
        properties: {
          date: {
            type: "string",
            maxLength: 20
          },
          report: {
            type: "object"
          }
        },
        required: ["date", "report"]
      }
    }
  })

  return db
}

// Call the async initialization function and export the collections
export const initialize = async () => {
  const db = await initializeDatabase()

  const messagesCollection = db[MESSAGES_COLLECTION]
  const vectorCollection = db[VECTOR_COLLECTION]
  const reportsCollection = db[REPORTS_COLLECTION]

  return { messagesCollection, vectorCollection, reportsCollection }
}

// Utility functions to operate on the collections
export const saveChatMessage = async (
  message: { id: string; type: string; text: string; timestamp: number },
  messagesCollection: any
) => {
  await messagesCollection.upsert(message)
  return "Message saved successfully."
}

export const getChatMessages = async (messagesCollection: any) => {
  return await messagesCollection.find().exec()
}

export const clearChatMessages = async (messagesCollection: any) => {
  await messagesCollection.remove()
  return "Messages cleared successfully."
}

export const viewDatabaseContent = async (
  messagesCollection: any,
  vectorCollection: any
) => {
  const messages = await messagesCollection.find().exec()
  const vectors = await vectorCollection.find().exec()

  console.log("Messages Collection:", messages)
  console.log("Vector Collection:", vectors)
}

export const saveDailyReport = async (
  date: string,
  report: any,
  reportsCollection: any
) => {
  await reportsCollection.upsert({ date, report })
  return "Report saved successfully."
}

export const getDailyReport = async (date: string, reportsCollection: any) => {
  const result = await reportsCollection.findOne({ selector: { date } }).exec()
  return result?.report || null
}
