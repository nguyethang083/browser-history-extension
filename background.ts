chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed and ready.")
})

// Listen for a message from the UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchBrowserHistory") {
    fetchAndSaveBrowserHistory()
    sendResponse({ status: "started" })
  }
})

async function fetchAndSaveBrowserHistory() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    chrome.history.search(
      {
        text: "",
        startTime: today.getTime(),
        maxResults: 1000
      },
      async (historyItems) => {
        const historyData = historyItems.map((item) => ({
          url: item.url,
          title: item.title,
          visitCount: item.visitCount,
          lastVisitTime: new Date(item.lastVisitTime).toISOString()
        }))

        const fileName = `browser_history_${today.toISOString().split("T")[0]}.json`

        try {
          // Convert historyData to a data URL
          const jsonData = JSON.stringify(historyData, null, 2)
          const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonData)}`

          // Use chrome.downloads.download to save the file
          chrome.downloads.download(
            {
              url: dataUrl,
              filename: fileName
            },
            (downloadId) => {
              if (chrome.runtime.lastError) {
                console.error(
                  `Download error: ${chrome.runtime.lastError.message}`
                )
              } else {
                console.log(`Browser history saved as ${fileName}`)
              }
            }
          )
        } catch (dataUrlError) {
          console.error(
            `Error creating data URL or saving file: ${dataUrlError.message}`
          )
        }
      }
    )
  } catch (error) {
    console.error(`Failed to fetch history: ${error.message}`)
  }
}
