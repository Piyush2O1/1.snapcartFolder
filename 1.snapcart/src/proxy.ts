
import { NextRequest, NextResponse } from "next/server"
import { auth } from "./auth"

export async function proxy(req:NextRequest){

    const {pathname}=req.nextUrl

    const authPages = ["/login", "/register"]
    const publicRoutes=["/", "/unauthorized"]
    const session=await auth()
    const callbackUrl=req.nextUrl.searchParams.get("callbackUrl")

     if(authPages.includes(pathname)){
        if(session && callbackUrl){
          const redirectUrl=callbackUrl ? new URL(callbackUrl,req.url) : new URL("/auth/redirect",req.url)
          if(redirectUrl.origin!==req.nextUrl.origin){
            return NextResponse.redirect(new URL("/auth/redirect",req.url))
          }
          return NextResponse.redirect(redirectUrl)
        }
        return NextResponse.next()
     }

     if(publicRoutes.includes(pathname)){
        return NextResponse.next()
     }

if(!session){
  const loginUrl=new URL("/login",req.url)
   loginUrl.searchParams.set("callbackUrl",req.url)
   return NextResponse.redirect(loginUrl)
}

const role=session.user?.role
if(pathname.startsWith("/user") && role!=="user"){
  return NextResponse.redirect(new URL("/unauthorized",req.url))
}
if(pathname.startsWith("/delivery") && role!=="deliveryBoy"){
  return NextResponse.redirect(new URL("/unauthorized",req.url))
}
if(pathname.startsWith("/admin") && role!=="admin"){
  return NextResponse.redirect(new URL("/unauthorized",req.url))
}


return NextResponse.next()

}

export const config = {
  matcher:'/((?!api|_next/static|_next/image|favicon.ico).*)',
}


// req------middleware------server
