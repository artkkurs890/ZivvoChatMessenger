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
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate request body
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 })
    }

    const { email, password } = result.data

    // Get user from Redis
    const userJson = await redis.hget("users", email)
    if (!userJson) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = JSON.parse(userJson as string)

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = await signToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    })

    // Return success response with token
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

