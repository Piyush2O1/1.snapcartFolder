import { auth } from "@/auth";
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest, context: { params: Promise<{ id: string; }>; }) {
  try {
    await connectDb()
    const session=await auth()
    const deliveryBoyId=session?.user?.id

    if(!deliveryBoyId || session?.user?.role!=="deliveryBoy"){
      return NextResponse.json({message:"unauthorize"},{status:403})
    }

    const {id}=await context.params
    const assignment=await DeliveryAssignment.findById(id)

    if(!assignment){
      return NextResponse.json({message:"assignment not found"},{status:404})
    }

    if(assignment.status!=="brodcasted"){
      return NextResponse.json({message:"assignment is no longer open"},{status:400})
    }

    assignment.brodcastedTo=assignment.brodcastedTo.filter(
      (boyId:mongoose.Types.ObjectId)=>boyId.toString()!==deliveryBoyId
    )

    const order=await Order.findById(assignment.order)

    if(assignment.brodcastedTo.length===0){
      assignment.status="completed"
      if(order && !order.assignedDeliveryBoy && order.status!=="delivered"){
        order.status="pending"
        order.assignment=null
        await order.save()
        await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})
      }
    }

    await assignment.save()
    await assignment.populate([
      {path:"brodcastedTo",select:"name mobile email image location isOnline"},
      {path:"assignedTo",select:"name mobile email image location isOnline"}
    ])

    await emitEventHandler("assignment-updated",{
      assignmentId:assignment._id,
      orderId:assignment.order,
      status:assignment.status,
      brodcastedTo:assignment.brodcastedTo
    })

    return NextResponse.json({message:"assignment rejected",assignment},{status:200})
  } catch (error) {
    const message=error instanceof Error ? error.message : String(error)
    return NextResponse.json({message:`reject assignment error ${message}`},{status:500})
  }
}
