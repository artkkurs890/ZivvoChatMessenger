import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { saveMessage, getConversationMessages, getGroupMessages } from "@/lib/message-service"

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { content, receiverId, isGroup } = await req.json()

    if (!content || !receiverId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Save message
    const message = await saveMessage({
      senderId: payload.sub as string,
      receiverId,
      content,
      isGroup: Boolean(isGroup),
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("Message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const url = new URL(req.url)
    const receiverId = url.searchParams.get("receiverId")
    const isGroup = url.searchParams.get("isGroup") === "true"

    if (!receiverId) {
      return NextResponse.json({ error: "Missing receiverId parameter" }, { status: 400 })
    }

    // Get messages
    let messages
    if (isGroup) {
      messages = await getGroupMessages(receiverId)
    } else {
      messages = await getConversationMessages(payload.sub as string, receiverId)
    }

    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

