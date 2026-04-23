import connectDb from "@/lib/db";
import { auth } from "@/auth";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDb()
        const session=await auth()
        if(session?.user?.role!=="admin"){
            return NextResponse.json(
                {message:"you are not admin"},
                {status:403}
            )
        }
        const orders=await Order.find({
            $or: [
                { paymentMethod: "cod" },
                { isPaid: true },
            ],
        })
            .populate({ path:"user", model:User })
            .populate({ path:"assignedDeliveryBoy", model:User })
            .populate({
                path:"assignment",
                model:DeliveryAssignment,
                populate:[
                    {path:"brodcastedTo",model:User,select:"name mobile email image location isOnline"},
                    {path:"assignedTo",model:User,select:"name mobile email image location isOnline"}
                ]
            })
            .sort({createdAt:-1})
        return NextResponse.json(
            orders,{status:200}
        )
    } catch (error) {
         console.error("get orders error:", error)
          return NextResponse.json(
            {message:`get orders error: ${error}`},{status:500}
        )
    }
}
