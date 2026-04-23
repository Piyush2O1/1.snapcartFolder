import { NextResponse } from "next/server"

import { auth } from "@/auth"
import connectDb from "@/lib/db"
import { isDatabaseUnavailable } from "@/lib/dbError"
import User from "@/models/user.model"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "user is not authenticated" },
        { status: 401 },
      )
    }

    await connectDb()

    const user = await User.findById(session.user.id).select("-password")

    if (!user) {
      return NextResponse.json(
        { message: "user not found" },
        { status: 404 },
      )
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        message: isDatabaseUnavailable(error)
          ? "database is unavailable"
          : `get me error : ${error}`,
      },
      { status: isDatabaseUnavailable(error) ? 503 : 500 },
    )
  }
}
