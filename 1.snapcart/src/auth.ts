import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import connectDb from "./lib/db"
import { isDatabaseUnavailable } from "./lib/dbError"
import User from "./models/user.model"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"
 
const hasEnvValue = (value?: string) => Boolean(value && !/^add your .* here$/i.test(value))
const googleAuthEnabled =
  hasEnvValue(process.env.GOOGLE_CLIENT_ID) &&
  hasEnvValue(process.env.GOOGLE_CLIENT_SECRET)

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
        credentials: {
        email: { label: "email",type:"email" },
        password: { label: "Password", type: "password" },
      } ,
     async authorize(credentials) {
            try {
                await connectDb()
                const email=String(credentials.email || "").trim().toLowerCase()
                const password=String(credentials.password || "")
                if(!email || !password){
                    throw new Error("email and password are required")
                }
                const user=await User.findOne({email})
                if(!user){
                    throw new Error("user does not exist")
                }
                const isMatch=await bcrypt.compare(password,user.password)
                if(!isMatch){
                    throw new Error("incorrect password")
                }
                return {
                    id:user._id.toString(),
                    email:user.email,
                    name:user.name,
                    role:user.role
                }
            } catch (error) {
                if(isDatabaseUnavailable(error)){
                    throw new Error("database_unavailable")
                }
                throw error
            }

          } 
    
    }),
    ...(googleAuthEnabled ? [Google({
      clientId:process.env.GOOGLE_CLIENT_ID,
      clientSecret:process.env.GOOGLE_CLIENT_SECRET
    })] : [])
  ],
  callbacks:{
    // token ke ander user ka data dalta hai
    async signIn({user,account}) {
      try {
        if(account?.provider=="google"){
          await connectDb()
          let dbUser=await User.findOne({email:user.email})
         if(!dbUser){
           dbUser=await User.create({
            name:user.name,
            email:user.email,
            image:user.image
           })
         }

         user.id=dbUser._id.toString()
         user.role=dbUser.role
        }
      } catch (error) {
        if(isDatabaseUnavailable(error)){
          return "/login?error=database_unavailable"
        }
        throw error
      }
      return true
    },
    jwt({token,user,trigger,session}) {
        if(user){
            token.id=user.id
            token.name=user.name
            token.email=user.email
            token.role=user.role
        }
  if(trigger=="update"){
    token.role=session.role
  }


        return token
    },
    session({session,token}) {
        if(session.user){
            session.user.id=token.id as string
            session.user.name=token.name as string
            session.user.email=token.email as string
            session.user.role=token.role as string
        }
        return session
    },
  },
  trustHost: true,
  pages:{
    signIn:"/login",
    error:"/login"
  },
  session:{
    strategy:"jwt",
    maxAge:10 * 24 * 60 * 60
  },
  secret:process.env.AUTH_SECRET
})


// connect db
//email check
//password match
