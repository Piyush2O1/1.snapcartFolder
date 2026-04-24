
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req:NextRequest){

    const {pathname}=req.nextUrl
    const allowReauth = req.nextUrl.searchParams.get("reauth") === "1"

    const authPages = ["/login", "/register"]
    const publicRoutes=["/", "/unauthorized"]
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    })
    const callbackUrl=req.nextUrl.searchParams.get("callbackUrl")

     if(authPages.includes(pathname)){
        if(allowReauth){
          return NextResponse.next()
        }
        if(token?.id){
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

if(!token?.id || !token?.role){
  const loginUrl=new URL("/login",req.url)
   loginUrl.searchParams.set("callbackUrl",req.url)
   return NextResponse.redirect(loginUrl)
}

const role=token.role as string
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
