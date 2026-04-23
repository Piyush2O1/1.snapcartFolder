import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

const OTP_EXPIRY_MS = 2 * 60 * 1000;

interface PopulatedUser {
  _id: unknown
  name?: string
  email?: string
}

const isDevelopment = process.env.NODE_ENV !== "production"

export async function POST(req: NextRequest) {
  try {
    await connectDb()
    const session = await auth()
    const deliveryBoyId = session?.user?.id

    if (!deliveryBoyId || session?.user?.role !== "deliveryBoy") {
      return NextResponse.json(
        { message: "you are not a delivery partner" },
        { status: 403 }
      )
    }

    const { orderId } = await req.json()
    const order = await Order.findById(orderId).populate<{ user: PopulatedUser }>("user", "name email")

    if (!order) {
      return NextResponse.json(
        { message: "order not found" },
        { status: 400 }
      )
    }

    if (String(order.assignedDeliveryBoy ?? "") !== deliveryBoyId) {
      return NextResponse.json(
        { message: "this order is not assigned to you" },
        { status: 403 }
      )
    }

    if (order.status === "delivered") {
      return NextResponse.json(
        { message: "order is already delivered" },
        { status: 400 }
      )
    }

    if (!order.user?.email) {
      return NextResponse.json(
        { message: "customer email not found" },
        { status: 400 }
      )
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)

    order.deliveryOtp = otp
    order.deliveryOtpExpiresAt = expiresAt
    order.deliveryOtpVerification = false
    await order.save()

    try {
      await sendMail(
        order.user.email,
        "Quick Basket Delivery OTP",
        `<div>
          <h2>Your Quick Basket delivery OTP is <strong>${otp}</strong></h2>
          <p>This OTP is valid for 2 minutes.</p>
          <p>Share it with the delivery partner only after receiving your order.</p>
        </div>`
      )
    } catch (mailError) {
      console.error("Delivery OTP mail failed:", mailError)

      if (isDevelopment) {
        return NextResponse.json(
          {
            message: "Email send failed in local dev. Use the OTP shown below to continue testing.",
            expiresAt,
            expiresInSeconds: OTP_EXPIRY_MS / 1000,
            debugOtp: otp,
          },
          { status: 200 }
        )
      }

      order.deliveryOtp = null
      order.deliveryOtpExpiresAt = null
      await order.save()

      return NextResponse.json(
        { message: "OTP email could not be sent. Check EMAIL and PASS in .env." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: "OTP sent to customer email",
        expiresAt,
        expiresInSeconds: OTP_EXPIRY_MS / 1000,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: `send otp error ${error}` },
      { status: 500 }
    )
  }
}
