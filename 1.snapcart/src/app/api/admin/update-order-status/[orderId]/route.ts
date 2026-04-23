import { auth } from "@/auth";
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest, context: { params: Promise<{ orderId: string; }>; }) {
    try {
        await connectDb()
        const session=await auth()
        if(session?.user?.role!=="admin"){
            return NextResponse.json({message:"you are not admin"},{status:403})
        }
        const {orderId}=await context.params
        const {status}=await req.json()
        const allowedStatuses=["pending","out of delivery","delivered"]
        if(!allowedStatuses.includes(status)){
            return NextResponse.json({message:"invalid order status"},{status:400})
        }
        const order=await Order.findById(orderId).populate("user")
        if(!order){
            return NextResponse.json(
                {message:"order not found"},
                {status:400}
            )
        }
        order.status=status
        let deliveryBoysPayload: {
            id:string
            name:string
            mobile?:string
            latitude:number
            longitude:number
        }[]=[]
        if(status==="out of delivery" && !order.assignment){
            const {latitude,longitude}=order.address
            let deliveryBoys=await User.find({
                role:"deliveryBoy",
                location:{
                    $near:{
                        $geometry:{type:"Point",coordinates:[Number(longitude),Number(latitude)]},
                        $maxDistance:10000
                    }
                }
            })
            if(deliveryBoys.length===0){
                deliveryBoys=await User.find({role:"deliveryBoy"})
            }
            const deliveryBoyIds=deliveryBoys.map((b)=>b._id)
            const busyIds=await DeliveryAssignment.find({
                assignedTo:{$in:deliveryBoyIds},
                status:"assigned"
            }).distinct("assignedTo")
            const busyIdSet=new Set(busyIds.map(b=>String(b)))
            const availableDeliveryBoys=deliveryBoys.filter(
                b=>!busyIdSet.has(String(b._id))
            )
             const candidates=availableDeliveryBoys.map(b=>b._id)

             if(candidates.length==0){
                order.status="pending"
                await order.save()
            
                await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})

                return NextResponse.json(
                {message:"there is no available Delivery boys"},
                {status:400}
            )
             }
   
             const deliveryAssignment=await DeliveryAssignment.create({
                order:order._id,
                brodcastedTo:candidates,
                status:"brodcasted"
             })

             await deliveryAssignment.populate([
                {path:"order"},
                {path:"brodcastedTo",select:"name mobile email image location isOnline"},
                {path:"assignedTo",select:"name mobile email image location isOnline"}
             ]);
             for(const boyId of candidates){
                const boy=await User.findById(boyId)
                if(boy.socketId){
                    await emitEventHandler("new-assignment",deliveryAssignment,boy.socketId)
                }
             }

            
            order.assignment=deliveryAssignment._id
            deliveryBoysPayload=availableDeliveryBoys.map(b=>({
                id:b._id.toString(),
                name:b.name,
                mobile:b.mobile,
                latitude:b.location?.coordinates?.[1] ?? 0,
                longitude:b.location?.coordinates?.[0] ?? 0
            }))
            await deliveryAssignment.populate([
                {path:"order"},
                {path:"brodcastedTo",select:"name mobile email image location isOnline"},
                {path:"assignedTo",select:"name mobile email image location isOnline"}
            ])
            
        }

        await order.save()
        await order.populate("user assignedDeliveryBoy")
        await order.populate({
            path:"assignment",
            populate:[
                {path:"brodcastedTo",select:"name mobile email image location isOnline"},
                {path:"assignedTo",select:"name mobile email image location isOnline"}
            ]
        })
      await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})
        return NextResponse.json({
            assignment:order.assignment?._id,
            order,
            availableBoys:deliveryBoysPayload
        },{status:200})

    } catch (error) {
        const message=error instanceof Error ? error.message : String(error)
         return NextResponse.json({
           message:`update status error ${message}`
        },{status:500})
    }
}
