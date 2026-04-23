import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

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

        const { orderId } = await req.json()
        if (!orderId) {
            return NextResponse.json(
                { message: "orderId is required" },
                { status: 400 }
            )
        }

        await Order.findOneAndDelete({
            _id: orderId,
            user: session.user.id,
            paymentMethod: "online",
            isPaid: false,
            status: "pending",
        })

        return NextResponse.json(
            { message: "cancelled order cleaned up" },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : `payment cancel error ${error}` },
            { status: 500 }
        )
    }
}
