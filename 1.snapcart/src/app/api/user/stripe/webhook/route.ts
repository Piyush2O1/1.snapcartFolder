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

    if (!hasEnvValue(process.env.STRIPE_WEBHOOK_SECRET)) {
        throw new Error("Stripe webhook secret is not configured")
    }

    return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(req: NextRequest) {
    try {
        const stripe = getStripeClient()
        const signature = req.headers.get("stripe-signature")
        const rawBody = await req.text()

        if (!signature) {
            return NextResponse.json(
                { message: "stripe signature missing" },
                { status: 400 }
            )
        }

        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )

        if (event.type === "checkout.session.completed") {
            const checkoutSession = event.data.object
            await connectDb()

            const order = await Order.findById(checkoutSession?.metadata?.orderId).populate("user assignedDeliveryBoy")
            if (order && !order.isPaid) {
                order.isPaid = true
                await order.save()
                await emitEventHandler("new-order", order)
            }
        }

        return NextResponse.json({ recieved: true }, { status: 200 })
    } catch (error) {
        console.error("signature verification failed", error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "signature verification failed" },
            { status: 400 }
        )
    }
}
