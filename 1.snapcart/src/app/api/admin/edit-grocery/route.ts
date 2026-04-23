import { auth } from "@/auth";
import uploadOnCloudinary from "@/lib/cloudinary";
import connectDb from "@/lib/db";
import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
        await connectDb()
        const session=await auth()
        if(session?.user?.role!=="admin"){
            return NextResponse.json(
                {message:"you are not admin"},
                {status:400}
            )
        }
    const formData=await req.formData()
    const name=formData.get("name") as string
    const groceryId=formData.get("groceryId") as string
    const category=formData.get("category") as string
      const unit=formData.get("unit") as string
    const price=formData.get("price") as string
    const file=formData.get("image") as Blob | null
    if(!groceryId || !name || !category || !unit || !price){
        return NextResponse.json(
            {message:"please fill all grocery fields"},
            {status:400}
        )
    }

    const updateData: {
        name:string
        price:string
        category:string
        unit:string
        image?:string
    } = {name,price,category,unit}

    if(file && file.size > 0){
     updateData.image=await uploadOnCloudinary(file)
    }
    const grocery=await Grocery.findByIdAndUpdate(groceryId,updateData,{new:true})
     return NextResponse.json(
                grocery,
                {status:200}
            )
    } catch (error) {
        const message=error instanceof Error ? error.message : String(error)
         return NextResponse.json(
                {message:`edit grocery error: ${message}`},
                {status:message.includes("Cloudinary") ? 400 : 500}
            )
    }
}


