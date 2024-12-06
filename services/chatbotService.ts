import { Groq } from "groq-sdk"

import { getDailyReport } from "./db"

const groq = new Groq({ apiKey: process.env.PLASMO_PUBLIC_GROQ_API_KEY })

export const sendMessageToGROQ = async (message: string) => {
  const today = new Date().toISOString().split("T")[0]
  const dailyReport = await getDailyReport(today)

  let reportText = "No report available for today."
  if (dailyReport) {
    reportText = JSON.stringify(dailyReport, null, 2)
  }

  const prompt = `
    You are a helpful assistant. Here is the daily report:
    ${reportText}
    Respond concisely and informatively to the following question:
    "${message}"
  `

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1
    })

    const responseContent = completion.choices[0]?.message?.content || ""
    console.log("Raw Response from GROQ:", responseContent)

    return {
      type: "bot",
      text: responseContent,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error("Error interacting with GROQ:", error)
    return {
      type: "bot",
      text: "Sorry, I encountered an error. Please try again later.",
      timestamp: Date.now()
    }
  }
}
