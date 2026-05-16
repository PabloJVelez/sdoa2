import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Simple health check - if we can reach this endpoint, the server is running
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime()
    })
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    })
  }
} 