// background.ts
import axios from "axios"

// Function to fetch browser history
async function fetchBrowserHistory() {
  try {
    const startTime = new Date().setHours(0, 0, 0, 0) // Start of the day

    // Fetch the user's browser history
    const historyItems = await chrome.history.search({
      text: "",
      startTime,
      maxResults: 1000
    })

    // Format history data
    const formattedHistory = historyItems.map((item) => ({
      id: item.id,
      title: item.title || "No title",
      url: item.url || "No URL",
      visitCount: item.visitCount || 0,
      lastVisitTime: item.lastVisitTime || 0
    }))

    // Send the data to the backend
    await axios.post("http://localhost:3000/browser-history/store", {
      data: formattedHistory
    })

    console.log("Browser history sent successfully.")
  } catch (error) {
    console.error("Error fetching or sending browser history:", error)
  }
}

// Set an interval to fetch and send browser history every hour
setInterval(fetchBrowserHistory, 3600000) // 3600000 ms = 1 hour

// Fetch browser history immediately on extension load
fetchBrowserHistory()
