import connectDb from "@/lib/db";
import { isDatabaseUnavailable } from "@/lib/dbError";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    try {
      await connectDb()
      const {name,email,password}=await req.json()
    const trimmedName=String(name || "").trim()
    const trimmedEmail=String(email || "").trim().toLowerCase()
    const rawPassword=String(password || "")

    if(!trimmedName || !trimmedEmail || !rawPassword){
        return NextResponse.json(
            {message:"name, email, and password are required"},
            {status:400}
        )
    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)){
        return NextResponse.json(
            {message:"please enter a valid email address"},
            {status:400}
        )
    }

    const existUser=await User.findOne({email:trimmedEmail})
    if(existUser){
        return NextResponse.json(
            {message:"an account with this email already exists"},
            {status:400}
        )
    }
   if(rawPassword.length<6){
    return NextResponse.json(
            {message:"password must be at least 6 characters"},
            {status:400}
        )
   }

   const hashedPassword=await bcrypt.hash(rawPassword,10)
   await User.create({
    name:trimmedName,email:trimmedEmail,password:hashedPassword
   })
    return NextResponse.json(
            {message:"account created successfully"},
            {status:201}
        )
        
    } catch (error) {
         return NextResponse.json(
            {message:isDatabaseUnavailable(error) ? "database is unavailable" : `register error ${error}`},
            {status:isDatabaseUnavailable(error) ? 503 : 500}
        )
    }
}
// connect db
// name,email,password frontend
// email check
// password 6 character
//password hash
// user create
