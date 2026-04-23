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
    const category=formData.get("category") as string
    const unit=formData.get("unit") as string
    const price=formData.get("price") as string
    const file=formData.get("image") as Blob | null

    if(!name || !category || !unit || !price || !file || file.size === 0){
        return NextResponse.json(
            {message:"please fill all grocery fields and upload an image"},
            {status:400}
        )
    }

    const imageUrl=await uploadOnCloudinary(file)
    const grocery=await Grocery.create({
        name,price,category,unit,image:imageUrl
    })
     return NextResponse.json(
                grocery,
                {status:200}
            )
    } catch (error) {
        const message=error instanceof Error ? error.message : String(error)
         return NextResponse.json(
                {message:`add grocery error: ${message}`},
                {status:message.includes("Cloudinary") ? 400 : 500}
            )
    }
}
