import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || "",
  token: process.env.UPSTASH_REDIS_TOKEN || "",
})

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json()

    switch (action) {
      case "send_message":
        // Store message in Redis
        const messageId = `message:${Date.now()}`
        await redis.hset(messageId, {
          ...data,
          timestamp: new Date().toISOString(),
        })

        // Add message to conversation history
        await redis.lpush(`conversation:${data.conversationId}`, messageId)

        // Publish message to Redis channel for real-time updates
        await redis.publish("messages", JSON.stringify(data))

        return NextResponse.json({ success: true, messageId })

      case "get_messages":
        // Get message IDs from conversation
        const messageIds = await redis.lrange(`conversation:${data.conversationId}`, 0, -1)

        // Get message details
        const messages = await Promise.all(
          messageIds.map(async (id) => {
            const message = await redis.hgetall(id)
            return message
          }),
        )

        return NextResponse.json({ success: true, messages })

      case "mark_as_read":
        // Update message status
        await redis.hset(`message:${data.messageId}`, "status", "read")
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Socket API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

