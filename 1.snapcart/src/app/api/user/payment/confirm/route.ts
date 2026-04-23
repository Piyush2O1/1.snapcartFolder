import { auth } from "@/auth";
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const hasEnvValue = (value?: string) => Boolean(value && !/^add your .* here$/i.test(value))

const getStripeClient = () => {
    if (!hasEnvValue(process.env.STRIPE_SECRET_KEY)) {
        throw new Error("Stripe secret key is not configured")
    }

    return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(req: NextRequest) {
    try {
        await connectDb()

        const session = await auth()
        if (!session?.user?.id || session.user.role !== "user") {
            return NextResponse.json(
                { message: "user is not authenticated" },
                { status: 403 }
            )
        }

        const { sessionId, orderId } = await req.json()
        if (!sessionId || !orderId) {
            return NextResponse.json(
                { message: "sessionId and orderId are required" },
                { status: 400 }
            )
        }

        const stripe = getStripeClient()
        const checkoutSession = await stripe.checkout.sessions.retrieve(String(sessionId))

        if (checkoutSession.payment_status !== "paid") {
            return NextResponse.json(
                { message: "payment is not completed yet" },
                { status: 400 }
            )
        }

        if (checkoutSession.metadata?.orderId !== String(orderId)) {
            return NextResponse.json(
                { message: "payment session does not match this order" },
                { status: 400 }
            )
        }

        const order = await Order.findById(orderId).populate("user assignedDeliveryBoy")
        if (!order) {
            return NextResponse.json(
                { message: "order not found" },
                { status: 404 }
            )
        }

        if (String(order.user?._id || order.user) !== session.user.id) {
            return NextResponse.json(
                { message: "you can only confirm your own order" },
                { status: 403 }
            )
        }

        const wasUnpaid = !order.isPaid
        order.isPaid = true
        await order.save()

        if (wasUnpaid) {
            await emitEventHandler("new-order", order)
        }

        return NextResponse.json(
            { message: "payment confirmed", orderId: order._id },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : `payment confirm error ${error}` },
            { status: 500 }
        )
    }
}
