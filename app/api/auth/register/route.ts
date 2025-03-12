import { NextResponse } from "next/server"
import { z } from "zod"
import { Redis } from "@upstash/redis"
import { signToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || "",
  token: process.env.UPSTASH_REDIS_TOKEN || "",
})

// Validation schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate request body
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 })
    }

    const { username, email, password } = result.data

    // Check if user already exists
    const existingUser = await redis.hget("users", email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate user ID
    const userId = `user_${Date.now()}`

    // Store user in Redis
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    }

    await redis.hset("users", { [email]: JSON.stringify(user) })

    // Generate JWT token
    const token = await signToken({
      sub: userId,
      email,
      username,
    })

    // Return success response with token
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        email,
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

