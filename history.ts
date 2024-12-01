export async function fetchBrowserHistory(): Promise<any[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  return new Promise((resolve, reject) => {
    chrome.history.search(
      {
        text: "",
        startTime: today.getTime(),
        endTime: tomorrow.getTime(),
        maxResults: 1000
      },
      (historyItems) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        const historyData = historyItems.map((item) => ({
          url: extractMainUrl(item.url),
          title: item.title,
          visitCount: item.visitCount,
          lastVisitTime: new Date(item.lastVisitTime).toISOString()
        }))

        resolve(historyData)
      }
    )
  })
}

function extractMainUrl(fullUrl: string): string {
  try {
    const url = new URL(fullUrl)
    return url.origin // Extract protocol and domain
  } catch {
    console.error("Invalid URL:", fullUrl)
    return fullUrl
  }
}
