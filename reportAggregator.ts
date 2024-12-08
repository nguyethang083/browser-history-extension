import { initialize, saveDailyReport } from "./services/vectordb"

export async function finalizeDailyReport(chunkReports: any[]): Promise<any> {
  console.log("Chunk Reports:", chunkReports)

  if (!chunkReports || chunkReports.length === 0) {
    throw new Error("No chunk reports available to finalize.")
  }

  const aggregatedReport = {
    totalVisits: 0,
    categories: {},
    mostVisitedSites: [],
    mostFrequentCategory: { category: "General", frequency: 0 },
    mostFrequentSite: { url: "", category: "General", visits: 0 }
  }

  // Process each report in the chunkReports array
  chunkReports.forEach((report, index) => {
    if (!report || typeof report !== "object") {
      console.error(
        `Chunk report at index ${index} is invalid or undefined:`,
        report
      )
      return
    }

    console.log(`Processing report at index ${index}:`, report)

    // Total visits
    aggregatedReport.totalVisits += report.totalVisits || 0

    // Aggregate categories
    if (report.categories && typeof report.categories === "object") {
      for (const [category, count] of Object.entries(report.categories)) {
        aggregatedReport.categories[category] =
          (aggregatedReport.categories[category] || 0) + (count || 0)
      }
    } else {
      console.warn(
        `Invalid categories in report at index ${index}:`,
        report.categories
      )
    }

    // Aggregate most visited sites
    if (Array.isArray(report.mostVisitedSites)) {
      report.mostVisitedSites.forEach((site) => {
        if (!site || !site.url || typeof site.visits !== "number") {
          console.warn("Invalid site in mostVisitedSites:", site)
          return
        }

        const existing = aggregatedReport.mostVisitedSites.find(
          (s) => s.url === site.url
        )
        if (existing) {
          existing.visits += site.visits
        } else {
          aggregatedReport.mostVisitedSites.push({ ...site })
        }
      })
    } else {
      console.warn(
        `Invalid or missing mostVisitedSites in report at index ${index}:`,
        report
      )
    }
  })

  // Determine the most frequent category
  const mostFrequentCategory = Object.entries(aggregatedReport.categories).sort(
    (a, b) => Number(b[1]) - Number(a[1])
  )[0]
  if (mostFrequentCategory) {
    aggregatedReport.mostFrequentCategory = {
      category: mostFrequentCategory[0],
      frequency: mostFrequentCategory[1] as number
    }
  }

  // Determine the most frequent site
  if (aggregatedReport.mostVisitedSites.length > 0) {
    aggregatedReport.mostVisitedSites.sort((a, b) => b.visits - a.visits)
    aggregatedReport.mostFrequentSite = aggregatedReport.mostVisitedSites[0]
  }

  console.log("Final Aggregated Report:", aggregatedReport)

  // Save the aggregated report to vectordb
  const { reportsCollection } = await initialize()
  const today = new Date().toISOString().split("T")[0]
  await saveDailyReport(today, aggregatedReport, reportsCollection)

  return aggregatedReport
}
