import { auth } from "@/auth"
import connectDb from "@/lib/db"
import Order from "@/models/order.model"
import User from "@/models/user.model"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req:NextRequest,context: { params: Promise<{ orderId: string; }>; }) {
    try {
        await connectDb()
        const session=await auth()
        if(!session?.user?.id){
            return NextResponse.json(
                {message:"user is not authenticated"},
               {status:403}
            )
        }
        const {orderId}=await context.params
        const order=await Order.findById(orderId)
            .populate({ path: "assignedDeliveryBoy", model: User })
            .populate({ path: "user", model: User })
        if(!order){
            return NextResponse.json(
                {message:"order not found"},
               {status:400}
            )
        }
        const canAccess =
            session.user.role==="admin" ||
            String(order.user._id ?? order.user)===session.user.id ||
            String(order.assignedDeliveryBoy?._id ?? order.assignedDeliveryBoy ?? "")===session.user.id
        if(!canAccess){
            return NextResponse.json(
                {message:"you can not access this order"},
               {status:403}
            )
        }
        return NextResponse.json(
                order,
               {status:200}
            )
    } catch (error) {
        return NextResponse.json(
                {message:`get order by id error ${error}`},
               {status:500}
            )
    }
}
