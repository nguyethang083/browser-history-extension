import React, { useEffect, useState } from "react"

import {
  clearChatMessages,
  getChatMessages,
  saveChatMessage
} from "../services/db"

const ChatbotTab = () => {
  const [chatMessages, setChatMessages] = useState([])
  const [userMessage, setUserMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadChatMessages()
  }, [])

  // Load chat messages from IndexedDB
  const loadChatMessages = async () => {
    const messages = await getChatMessages()
    setChatMessages(messages)
  }

  // Fetch bot reply using Groq
  const fetchBotReply = async (userMessage: string) => {
    console.log("Sending message to background:", userMessage)
    try {
      const response = await chrome.runtime.sendMessage({
        type: "getChatCompletion",
        messages: [{ role: "user", content: userMessage }]
      })

      console.log("Response from background script:", response)

      if (response.success) {
        return response.data
      } else {
        console.error("Error in response:", response.error)
        return `Bot Error: ${response.error}`
      }
    } catch (error) {
      console.error("Error communicating with background script:", error)
      return "Error fetching bot reply."
    }
  }

  // Handle chat submission
  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!userMessage.trim()) return

    const userMsg = { type: "user", text: userMessage, timestamp: Date.now() }
    setChatMessages((prevMessages) => [...prevMessages, userMsg])
    await saveChatMessage(userMsg)
    setUserMessage("")
    setLoading(true)

    try {
      const botReplyText = await fetchBotReply(userMessage)
      console.log("Bot reply:", botReplyText)
      const botReply = {
        type: "bot",
        text: botReplyText,
        timestamp: Date.now()
      }

      setChatMessages((prevMessages) => [...prevMessages, botReply])
      await saveChatMessage(botReply)
    } catch (error) {
      console.error("Error sending message to GROQ:", error)
    } finally {
      setLoading(false)
    }
  }

  // Clear chat history
  const clearChatHistory = async () => {
    await clearChatMessages()
    setChatMessages([])
  }

  return (
    <div>
      <h1>Chatbot</h1>
      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "5px",
          padding: "1rem",
          marginBottom: "1rem"
        }}>
        {chatMessages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: "1rem",
              textAlign: message.type === "user" ? "right" : "left"
            }}>
            <p
              style={{
                display: "inline-block",
                padding: "0.5rem",
                borderRadius: "5px",
                background: message.type === "user" ? "#d1e7dd" : "#f8d7da",
                color: "#333",
                maxWidth: "70%",
                wordWrap: "break-word"
              }}>
              {message.text}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleChatSubmit}>
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Type your message..."
          style={{
            width: "calc(100% - 90px)",
            padding: "0.5rem",
            marginRight: "1rem",
            border: "1px solid #ddd",
            borderRadius: "5px"
          }}
          disabled={loading}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
          disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
      <button
        onClick={clearChatHistory}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          background: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}>
        Clear Chat
      </button>
    </div>
  )
}

export default ChatbotTab
