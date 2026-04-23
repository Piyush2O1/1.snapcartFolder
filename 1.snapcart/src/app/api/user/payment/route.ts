import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
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

        if (!hasEnvValue(process.env.NEXT_BASE_URL)) {
            return NextResponse.json(
                { message: "NEXT_BASE_URL is not configured" },
                { status: 500 }
            )
        }

        const { userId, items, paymentMethod, totalAmount, address } = await req.json()
        if (!items || !userId || !paymentMethod || !totalAmount || !address) {
            return NextResponse.json(
                { message: "please send all credentials" },
                { status: 400 }
            )
        }

        if (userId !== session.user.id) {
            return NextResponse.json(
                { message: "you can only create payment for your own order" },
                { status: 403 }
            )
        }

        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }

        const newOrder = await Order.create({
            user: userId,
            items,
            paymentMethod,
            totalAmount,
            address
        })

        const stripe = getStripeClient()
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: user.email || undefined,
            success_url: `${process.env.NEXT_BASE_URL}/user/orders/success?session_id={CHECKOUT_SESSION_ID}&orderId=${newOrder._id.toString()}`,
            cancel_url: `${process.env.NEXT_BASE_URL}/user/orders/cancel?orderId=${newOrder._id.toString()}`,
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: "Quick Basket Order Payment",
                        },
                        unit_amount: Math.round(Number(totalAmount) * 100),
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                orderId: newOrder._id.toString(),
                userId,
            },
        })

        return NextResponse.json({ url: stripeSession.url }, { status: 200 })
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : `order payment error ${error}` },
            { status: 500 }
        )
    }
}
