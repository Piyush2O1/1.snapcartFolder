import connectDb from "@/lib/db";
import { isDatabaseUnavailable } from "@/lib/dbError";
import emitEventHandler from "@/lib/emitEventHandler";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session=await auth()
        if(!session?.user?.id || session.user.role!=="user"){
            return NextResponse.json(
                { message: "user is not authenticated" },
                { status: 403 }
            )
        }
        await connectDb()
        const { userId, items, paymentMethod, totalAmount, address } = await req.json()
        if (!items || !paymentMethod || totalAmount == null || !address) {
            return NextResponse.json(
                { message: "please send all credentials" },
                { status: 400 }
            )
        }
        const normalizedItems=Array.isArray(items) ? items : []
        const normalizedPaymentMethod=String(paymentMethod || "").trim()
        const normalizedTotalAmount=Number(totalAmount)
        const fullName=String(address?.fullName || "").trim()
        const mobile=String(address?.mobile || "").replace(/\D/g,"").slice(0,10)
        const city=String(address?.city || "").trim()
        const state=String(address?.state || "").trim()
        const pincode=String(address?.pincode || "").replace(/\D/g,"").slice(0,6)
        const fullAddress=String(address?.fullAddress || "").trim()
        const latitude=Number(address?.latitude)
        const longitude=Number(address?.longitude)

        if(userId && userId!==session.user.id){
            return NextResponse.json(
                { message: "you can only place your own order" },
                { status: 403 }
            )
        }

        if(normalizedItems.length===0){
            return NextResponse.json(
                { message: "your cart is empty" },
                { status: 400 }
            )
        }

        const hasInvalidItem=normalizedItems.some((item)=>(
            !item?.grocery ||
            !String(item?.name || "").trim() ||
            Number(item?.quantity) <= 0 ||
            Number(item?.price) < 0
        ))
        if(hasInvalidItem){
            return NextResponse.json(
                { message: "please review your cart items and try again" },
                { status: 400 }
            )
        }

        if(!["cod","online"].includes(normalizedPaymentMethod)){
            return NextResponse.json(
                { message: "please choose a valid payment method" },
                { status: 400 }
            )
        }

        if(!Number.isFinite(normalizedTotalAmount) || normalizedTotalAmount<=0){
            return NextResponse.json(
                { message: "total amount must be greater than zero" },
                { status: 400 }
            )
        }

        if(!fullName || mobile.length!==10 || !city || !state || pincode.length!==6 || !fullAddress){
            return NextResponse.json(
                { message: "please complete the full delivery address before placing your order" },
                { status: 400 }
            )
        }

        if(!Number.isFinite(latitude) || !Number.isFinite(longitude)){
            return NextResponse.json(
                { message: "please choose a valid delivery location on the map" },
                { status: 400 }
            )
        }
        const user = await User.findById(session.user.id)
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }

        const newOrder = await Order.create({
            user: session.user.id,
            items: normalizedItems,
            paymentMethod: normalizedPaymentMethod,
            totalAmount: normalizedTotalAmount,
            address: {
                fullName,
                mobile,
                city,
                state,
                pincode,
                fullAddress,
                latitude,
                longitude
            }
        })
        await newOrder.populate("user assignedDeliveryBoy")


        await emitEventHandler("new-order",newOrder)

        return NextResponse.json(
            newOrder,
            { status: 201 }
        )

    } catch (error) {
        return NextResponse.json(
            {message:isDatabaseUnavailable(error) ? "database is unavailable" : `place order error ${error}`},
            {status:isDatabaseUnavailable(error) ? 503 : 500}
        )
    }
}
