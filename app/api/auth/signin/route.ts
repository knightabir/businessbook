import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await request.json()

    // Find user in the database
    const user = await User.findOne({ email: email })

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // In a real app, you'd create a JWT token or session here
    const response = NextResponse.json(
      { message: "Login successful", user: { id: user._id, email: user.email, firstName: user.name.firstName, lastName: user.name.lastName } },
      { status: 200 },
    )

    // Set a simple session cookie
    response.cookies.set("session", JSON.stringify({ id: user._id, email: user.email, firstName: user.name.firstName, lastName: user.name.lastName }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

