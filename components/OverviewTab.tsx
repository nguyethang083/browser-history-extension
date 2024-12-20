import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"
import React, { useEffect, useState } from "react"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

const OverviewTab = () => {
  const [chartData, setChartData] = useState(null)
  const [mostFrequentSite, setMostFrequentSite] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchDailyReport()
  }, [])

  const fetchDailyReport = () => {
    setLoading(true)
    setErrorMessage("")

    chrome.runtime.sendMessage({ action: "fetchDailyReport" }, (response) => {
      if (response?.status === "success") {
        updateChartData(response.report)
      } else if (response?.message === "No report found.") {
        processBrowserHistory() // Trigger processing if no report exists
      } else {
        setErrorMessage(response?.message || "Error fetching data.")
        setLoading(false)
      }
    })
  }

  const processBrowserHistory = () => {
    chrome.runtime.sendMessage(
      { action: "processBrowserHistory" },
      (response) => {
        if (response?.status === "success") {
          fetchDailyReport() // Fetch the new report after processing
        } else {
          setErrorMessage(response?.message || "Error processing history.")
          setLoading(false)
        }
      }
    )
  }

  const updateChartData = (report) => {
    const { categories, mostFrequentSite } = report

    // Update the most frequent site
    setMostFrequentSite(mostFrequentSite)

    // Prepare chart data
    const filteredLabels = Object.keys(categories).filter(
      (key) => categories[key] > 0
    )
    const filteredValues = filteredLabels.map((key) => categories[key])

    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#FFC0CB",
      "#FFD700",
      "#8A2BE2",
      "#00FF7F"
    ]

    setChartData({
      labels: filteredLabels,
      datasets: [
        {
          label: "Categories",
          data: filteredValues,
          backgroundColor: colors.slice(0, filteredLabels.length),
          hoverBackgroundColor: colors.slice(0, filteredLabels.length)
        }
      ]
    })

    setLoading(false)
  }

  return (
    <div>
      <h1>Your Daily Activities</h1>
      <button
        onClick={processBrowserHistory}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          background: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          transition: "background 0.3s"
        }}>
        Fetch Data
      </button>
      {loading ? (
        <p>Loading...</p>
      ) : errorMessage ? (
        <p>{errorMessage}</p>
      ) : (
        <>
          {chartData && <Doughnut data={chartData} />}
          {mostFrequentSite && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.5rem",
                background: "#e9f7ef",
                border: "1px solid #c3e6cb",
                borderRadius: "5px"
              }}>
              <h3 style={{ margin: "0 0 0.5rem" }}>Most Frequent Site</h3>
              <p style={{ margin: 0 }}>
                <a
                  href={mostFrequentSite.url}
                  target="_blank"
                  rel="noopener noreferrer">
                  {mostFrequentSite.url}
                </a>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default OverviewTab
