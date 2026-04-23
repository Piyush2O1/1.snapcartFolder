import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { isDatabaseUnavailable } from "@/lib/dbError";
import User from "@/models/user.model";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
       const session=await auth()
       if(!session?.user?.id){
        return NextResponse.json(
            {message:"user is not authenticated"},
            {status:401}
        )
       }

       const {role,mobile}=await req.json()
       const nextRole=String(role || "").trim()
       const nextMobile=String(mobile || "").replace(/\D/g,"").slice(0,10)
       const allowedRoles=["user","deliveryBoy","admin"] as const

       if(!allowedRoles.includes(nextRole as (typeof allowedRoles)[number])){
        return NextResponse.json(
            {message:"please select a valid role"},
            {status:400}
        )
       }

       if(nextMobile.length!==10){
        return NextResponse.json(
            {message:"please enter a valid 10-digit mobile number"},
            {status:400}
        )
       }

       await connectDb()

       const existingUser=await User.findById(session.user.id)
       if(!existingUser){
        return NextResponse.json(
            {message:"user not found"},
            {status:404}
        )
       }

       const profileCompleted=Boolean(existingUser.mobile)
       if(profileCompleted && existingUser.role!==nextRole){
        return NextResponse.json(
            {message:"role cannot be changed after profile is completed"},
            {status:403}
        )
       }

       if(nextRole==="admin"){
        const existingAdmin=await User.findOne({
            role:"admin",
            _id:{$ne:session.user.id}
        })
        if(existingAdmin){
            return NextResponse.json(
                {message:"an admin account already exists"},
                {status:403}
            )
        }
       }

       const user=await User.findByIdAndUpdate(session.user.id,{
        role:nextRole,
        mobile:nextMobile
       },{new:true}).select("-password")
       if(!user){
        return NextResponse.json(
            {message:"user not found"},
            {status:400}
        )
       }
       return NextResponse.json(
            user,
            {status:200}
        )
    } catch (error) {
         return NextResponse.json(
             {message:isDatabaseUnavailable(error) ? "database is unavailable" : `edit role and mobile error ${error}`},
            {status:isDatabaseUnavailable(error) ? 503 : 500}
        )
    }
}
