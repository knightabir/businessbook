import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Store from "@/models/Store"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const {
      email,
      password,
      confirmPassword,
      storeName,
      storePhone,
      firstName,
      lastName,
      countryCode,
      gstNumber,
      village,
      postOffice,
      policeStation,
      district,
      state,
      postalPin
    } = await request.json()

    if (
      !email ||
      !password ||
      !confirmPassword ||
      !storeName ||
      !storePhone ||
      !firstName ||
      !lastName ||
      !countryCode ||
      !village ||
      !postOffice ||
      !policeStation ||
      !district ||
      !state ||
      !postalPin
    ) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match" }, { status: 400 })
    }

    const existingUser = await User.findOne({ email: email })
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    const createdUser = new User({
      email,
      password,
      name: {
        firstName,
        lastName
      }
    })

    await createdUser.save()

    const createdStore = new Store({
      userId: createdUser._id,
      name: storeName,
      gstNumber,
      address: {
        villageOrTown: village,
        post: postOffice,
        police: policeStation,
        district,
        state,
        pincode: postalPin
      },
      contact: {
        countryCode,
        phone: storePhone
      }
    })

    await createdStore.save()

    return NextResponse.json({ message: "Registration successful" }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

