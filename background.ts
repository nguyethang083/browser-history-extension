const FETCH_INTERVAL_MINUTES = 3 * 60 // 3 hours
const CLIENT_ID =
  "293106981035-c8utq3j3nikhkfu3k4e8ke84e3naq4d1.apps.googleusercontent.com"
const REDIRECT_URI =
  process.env.NODE_ENV === "development"
    ? "http://localhost:1012/"
    : `https://${chrome.runtime.id}.chromiumapp.org/`

const AUTH_URL = `https://accounts.google.com/o/oauth2/auth?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed and ready.")
})

// Listen for a message from the UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchBrowserHistory") {
    fetchAndSendBrowserHistory()
      .then(() => sendResponse({ status: "success" }))
      .catch((error) => {
        console.error(error)
        sendResponse({ status: "error", message: error.message })
      })
    return true // Indicates the response is asynchronous
  }
})

function setupFetchAlarm() {
  chrome.alarms.create("fetchBrowserHistoryAlarm", {
    periodInMinutes: FETCH_INTERVAL_MINUTES
  })

  console.log(
    `Alarm set to fetch browser history every ${FETCH_INTERVAL_MINUTES} minutes.`
  )
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchBrowserHistoryAlarm") {
    console.log("Fetching browser history as per the alarm.")
    fetchAndSendBrowserHistory()
      .then(() => console.log("Browser history fetched successfully."))
      .catch((error) => console.error("Error fetching browser history:", error))
  }
})

async function fetchAndSendBrowserHistory() {
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

        // Start OAuth2 flow to get account info
        const accountInfo = await startOAuthFlow()

        await sendDataToEndpoint(historyData, accountInfo)
      }
    )
  } catch (error) {
    console.error(`Failed to fetch history: ${error.message}`)
    throw error
  }
}

async function startOAuthFlow(): Promise<{ email: string; name: string }> {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: AUTH_URL,
        interactive: true
      },
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
          // Fetch user info from Google People API
          const response = await fetch(
            "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses",
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          )
          const data = await response.json()

          if (!data.emailAddresses || !data.names) {
            reject(new Error("Unable to retrieve user info."))
            return
          }

          resolve({
            email: data.emailAddresses[0].value,
            name: data.names[0].displayName
          })
        } catch (error) {
          console.error("Error fetching user info:", error)
          reject(new Error("Error fetching user info."))
        }
      }
    )
  })
}

async function sendDataToEndpoint(
  historyData: any[],
  accountInfo: { email: string; name: string }
) {
  const endpointUrl = "http://localhost:3000/browser-history/store"

  try {
    const today = new Date().toISOString().split("T")[0]

    const payload = {
      date: today,
      account: accountInfo,
      data: historyData
    }

    console.log("Sending payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `Failed to send data to the endpoint: ${response.statusText}`
      )
      console.error(`Error details: ${errorText}`)
      throw new Error(errorText)
    }

    const result = await response.json()
    console.log("Data successfully sent to the endpoint:", result)
  } catch (error) {
    console.error(`Error sending data to the endpoint: ${error.message}`)
    throw error
  }
}
