import { Groq } from "groq-sdk"

const groq = new Groq({ apiKey: process.env.PLASMO_PUBLIC_GROQ_API_KEY })

const CHECKPOINT_KEY = "processedChunks"
const MAX_RETRIES = 3 // Maximum retry attempts per chunk
const CATEGORIES = [
  "News",
  "Social Media",
  "Shopping",
  "Entertainment",
  "Education",
  "Technology",
  "Health",
  "Finance",
  "Travel",
  "Sports",
  "General"
]

export async function processChunks(
  historyData: any[],
  chunkSize = 10
): Promise<any[]> {
  const totalChunks = Math.ceil(historyData.length / chunkSize)
  const chunkReports: any[] = []

  let processedChunks: number[] = []
  try {
    const result = await chrome.storage.local.get(CHECKPOINT_KEY)
    processedChunks = result[CHECKPOINT_KEY] || []
    console.log("Loaded checkpoint:", processedChunks)
  } catch (error) {
    console.log("No checkpoint found. Starting fresh.")
  }

  for (let i = 0; i < totalChunks; i++) {
    if (processedChunks.includes(i)) {
      console.log(`Skipping already processed chunk ${i + 1} of ${totalChunks}`)
      continue
    }

    const chunk = historyData.slice(i * chunkSize, (i + 1) * chunkSize)
    console.log(`Processing chunk ${i + 1} of ${totalChunks}`)

    let retryCount = 0
    let success = false

    while (retryCount < MAX_RETRIES && !success) {
      try {
        const chunkReport = await analyzeChunkWithGROQ(chunk)
        chunkReports.push(chunkReport)

        // Mark chunk as processed
        processedChunks.push(i)
        await saveCheckpoint(processedChunks)

        success = true
        console.log(`Chunk ${i + 1} processed successfully.`)
      } catch (error) {
        retryCount++
        console.error(
          `Error processing chunk ${i + 1} (Attempt ${retryCount} of ${MAX_RETRIES}):`,
          error
        )
      }
    }

    if (!success) {
      console.error(
        `Failed to process chunk ${i + 1} after ${MAX_RETRIES} retries. Saving progress and exiting.`
      )
      break
    }
  }

  console.log("All chunks processed or maximum retries reached.")
  return chunkReports
}

async function analyzeChunkWithGROQ(chunk: any[]): Promise<any> {
  const historyText = chunk
    .map((item) => `${item.url} - ${item.title || ""}`)
    .join("\n")

  const prompt = `
    Analyze this browser history chunk by categorizing each site based on its content into one of the following categories:
    ${JSON.stringify(CATEGORIES)}
    Return only a valid JSON object in this exact format:
    {
      "totalVisits": number,
      "categories": {"category1": number, "category2": number, ...},
      "mostVisitedSites": [{"url": "string", "category": "string", "visits": number}, ...],
      "mostFrequentCategory": {"category": "string", "frequency": number},
      "mostFrequentSite": {"url": "string", "category": "string", "visits": number}
    }
    Do not include any additional text, explanation, or formatting outside the JSON object. Respond in JSON ONLY!!!
    Analyze the following data:
    ${historyText}
  `

  console.log("Prompt sent to GROQ:", prompt)

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

    const extractedJson = extractJsonFromText(responseContent)

    if (extractedJson) {
      console.log("Extracted JSON:", extractedJson)
      return extractedJson
    } else {
      throw new Error("No valid JSON found in the GROQ response.")
    }
  } catch (error) {
    console.error("Error analyzing chunk with GROQ:", error)
    throw error
  }
}

// Utility function for extracting JSON from a response
function extractJsonFromText(text: string): any {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    console.warn("No JSON-like content found in the text.")
    return null
  }

  try {
    return JSON.parse(match[0])
  } catch (error) {
    console.error("Error parsing extracted JSON:", error.message)
    return null
  }
}

// Save checkpoint to storage
async function saveCheckpoint(processedChunks: number[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [CHECKPOINT_KEY]: processedChunks })
    console.log("Checkpoint saved.")
  } catch (error) {
    console.error("Error saving checkpoint:", error)
  }
}
