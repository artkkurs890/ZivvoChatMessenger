import { Redis } from "@upstash/redis"

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || "",
  token: process.env.UPSTASH_REDIS_TOKEN || "",
})

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  status: "sent" | "delivered" | "read"
  isGroup?: boolean
}

export async function saveMessage(message: Omit<Message, "id" | "timestamp" | "status">) {
  const messageId = `message:${Date.now()}`
  const timestamp = new Date().toISOString()

  const fullMessage = {
    ...message,
    id: messageId,
    timestamp,
    status: "sent",
  }

  // Store message in Redis
  await redis.hset(messageId, fullMessage)

  // Add to conversation history
  const conversationId = message.isGroup
    ? `group:${message.receiverId}`
    : `conversation:${[message.senderId, message.receiverId].sort().join(":")}`

  await redis.lpush(conversationId, messageId)

  return fullMessage
}

export async function getConversationMessages(userId1: string, userId2: string, limit = 50) {
  const conversationId = `conversation:${[userId1, userId2].sort().join(":")}`
  const messageIds = await redis.lrange(conversationId, 0, limit - 1)

  if (!messageIds.length) return []

  const messages = await Promise.all(
    messageIds.map(async (id) => {
      const message = await redis.hgetall(id)
      return message as Message
    }),
  )

  return messages
}

export async function getGroupMessages(groupId: string, limit = 50) {
  const conversationId = `group:${groupId}`
  const messageIds = await redis.lrange(conversationId, 0, limit - 1)

  if (!messageIds.length) return []

  const messages = await Promise.all(
    messageIds.map(async (id) => {
      const message = await redis.hgetall(id)
      return message as Message
    }),
  )

  return messages
}

export async function updateMessageStatus(messageId: string, status: "delivered" | "read") {
  await redis.hset(`message:${messageId}`, "status", status)
  return { success: true }
}

