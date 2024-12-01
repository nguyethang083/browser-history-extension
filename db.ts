export async function openIndexedDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("DailyReportDB", 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("reports")) {
        db.createObjectStore("reports", { keyPath: "date" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = (event) => reject((event.target as IDBRequest).error)
  })
}

export async function saveDailyReport(date: string, report: any) {
  const db = await openIndexedDB()
  const transaction = db.transaction("reports", "readwrite")
  const store = transaction.objectStore("reports")

  store.put({ date, report })

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve("Report saved successfully.")
    transaction.onerror = (event) =>
      reject((event.target as IDBTransaction).error)
  })
}

export async function getDailyReport(date: string) {
  const db = await openIndexedDB()
  const transaction = db.transaction("reports", "readonly")
  const store = transaction.objectStore("reports")

  return new Promise((resolve, reject) => {
    const request = store.get(date)
    request.onsuccess = () => resolve(request.result?.report || null)
    request.onerror = (event) => reject((event.target as IDBRequest).error)
  })
}
