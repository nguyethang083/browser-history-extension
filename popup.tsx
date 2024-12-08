import { useState } from "react"

import ChatbotTab from "~components/ChatbotTab"
import OverviewTab from "~components/OverviewTab"

const Popup = () => {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div
      style={{
        width: "320px",
        height: "500px",
        padding: "1rem",
        background: "#f9f9f9",
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column"
      }}>
      <div
        style={{
          display: "flex",
          marginBottom: "1rem",
          borderBottom: "1px solid #ddd"
        }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            flex: 1,
            padding: "0.5rem",
            background: activeTab === "overview" ? "#007bff" : "#f8f9fa",
            color: activeTab === "overview" ? "#fff" : "#333",
            border: "none",
            borderBottom:
              activeTab === "overview" ? "2px solid #0056b3" : "none",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "background 0.3s, color 0.3s"
          }}>
          Overview
        </button>
        <button
          onClick={() => setActiveTab("chatbot")}
          style={{
            flex: 1,
            padding: "0.5rem",
            background: activeTab === "chatbot" ? "#007bff" : "#f8f9fa",
            color: activeTab === "chatbot" ? "#fff" : "#333",
            border: "none",
            borderBottom:
              activeTab === "chatbot" ? "2px solid #0056b3" : "none",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "background 0.3s, color 0.3s"
          }}>
          Chatbot
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.5rem",
          background: "#fff",
          borderRadius: "5px",
          boxShadow: "inset 0px 4px 8px rgba(0, 0, 0, 0.1)"
        }}>
        {activeTab === "overview" ? <OverviewTab /> : <ChatbotTab />}
      </div>
    </div>
  )
}

export default Popup
