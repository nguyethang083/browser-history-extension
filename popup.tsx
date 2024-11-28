import React from "react"

const Popup = () => {
  const handleFetchHistory = () => {
    chrome.runtime.sendMessage(
      { action: "fetchBrowserHistory" },
      (response) => {
        if (response.status === "started") {
          alert("Fetching browser history...")
        }
      }
    )
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Browser History Fetcher</h1>
      <button onClick={handleFetchHistory}>Fetch Data</button>
    </div>
  )
}

export default Popup
