import { auth } from "@/auth";
import connectDb from "@/lib/db";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";

import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDb()
        const session=await auth()
        const deliveryBoyId=session?.user?.id
        if(session?.user?.role!=="deliveryBoy"){
            return NextResponse.json(
                {message:"you are not a delivery partner"},
                {status:403}
            )
        }
        const activeAssignment=await DeliveryAssignment.findOne({
            assignedTo:deliveryBoyId,
            status:"assigned"
        })
        .populate({
            path:"order",
            model:Order,
            populate:[
                {path:"user",model:User,select:"name email mobile image"},
                {path:"assignedDeliveryBoy",model:User,select:"name email mobile image location"}
            ]
        })
        .lean()
   if(!activeAssignment){
    return NextResponse.json(
        {active:false},
        {status:200}
    )
   }
    return NextResponse.json(
        {active:true,assignment:activeAssignment},
        {status:200}
    )

    } catch (error) {
        return NextResponse.json(
        {message:`current order error ${error}`},
        {status:500}
    )
    }
}
