import { processChunks } from "./chunkProcessor"
import { getDailyReport, saveDailyReport } from "./db"
import { fetchBrowserHistory } from "./history"
import { finalizeDailyReport } from "./reportAggregator"

const CLIENT_ID = process.env.PLASMO_PUBLIC_GOOGLE_CLIENT_ID
const REDIRECT_URI =
  process.env.NODE_ENV === "development"
    ? "http://localhost:1012/"
    : `https://${chrome.runtime.id}.chromiumapp.org/`

const AUTH_URL = `https://accounts.google.com/o/oauth2/auth?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`

let cachedEmail: string | null = null

// OAuth flow
async function startOAuthFlow(): Promise<{ email: string; name: string }> {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: AUTH_URL, interactive: true },
      async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          reject(
            new Error(chrome.runtime.lastError?.message || "OAuth flow failed.")
          )
          return
        }

        const params = new URLSearchParams(new URL(redirectUrl).hash.slice(1))
        const accessToken = params.get("access_token")

        if (!accessToken) {
          reject(new Error("Failed to obtain access token."))
          return
        }

        try {
          const response = await fetch(
            "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses",
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
          const data = await response.json()

          if (!data.emailAddresses || !data.names) {
            reject(new Error("Unable to retrieve user info."))
            return
          }

          const email = data.emailAddresses[0].value
          const name = data.names[0].displayName

          resolve({ email, name })
        } catch (error) {
          reject(new Error("Error fetching user info."))
        }
      }
    )
  })
}

// On install
chrome.runtime.onInstalled.addListener(() => {
  startOAuthFlow()
    .then(({ email }) => {
      cachedEmail = email
      console.log("Email cached:", cachedEmail)
    })
    .catch((error) =>
      console.error("Initial authentication failed:", error.message)
    )
})

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const today = new Date().toISOString().split("T")[0]

  if (message.action === "getUserEmail") {
    sendResponse(
      cachedEmail ? { email: cachedEmail } : { error: "Not cached." }
    )
    return true
  }

  if (message.action === "fetchDailyReport") {
    getDailyReport(today)
      .then((report) => {
        if (report) {
          sendResponse({ status: "success", report })
        } else {
          sendResponse({ status: "error", message: "No report found." })
        }
      })
      .catch((error) => {
        console.error("Error fetching daily report:", error)
        sendResponse({ status: "error", message: error.message })
      })
    return true
  }

  if (message.action === "processBrowserHistory") {
    fetchBrowserHistory()
      .then((history) => processChunks(history))
      .then(finalizeDailyReport)
      .then((report) => saveDailyReport(today, report))
      .then(() => sendResponse({ status: "success", message: "Report saved." }))
      .catch((error) => {
        console.error("Error processing history:", error)
        sendResponse({ status: "error", message: error.message })
      })
    return true
  }
})
