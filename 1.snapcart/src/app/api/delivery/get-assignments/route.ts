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
       if(session?.user?.role!=="deliveryBoy"){
        return NextResponse.json(
          {message:"you are not a delivery partner"},
          {status:403}
        )
       }
        const assignments=await DeliveryAssignment.find({
          brodcastedTo:session?.user?.id,
          status:"brodcasted"
        })
        .populate({
          path:"order",
          model:Order,
          populate:[
            {path:"user",model:User,select:"name email mobile image"},
            {path:"assignedDeliveryBoy",model:User,select:"name mobile email image location"}
          ]
        })
        .sort({createdAt:-1})
        return NextResponse.json(
            assignments,{status:200}
        )
    } catch (error) {
        return NextResponse.json(
           {message:`get assignments error ${error}`},{status:500}
        )
    }
}
