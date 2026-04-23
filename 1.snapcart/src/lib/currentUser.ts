import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import connectDb from '@/lib/db'
import User from '@/models/user.model'

export type PlainCurrentUser = {
  _id: string
  name: string
  email: string
  mobile?: string
  role: "user" | "deliveryBoy" | "admin"
  image?: string
}

export async function getCurrentUserOrRedirect(expectedRole?: PlainCurrentUser["role"]) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  await connectDb()
  const user = await User.findById(session.user.id)

  if (!user) {
    redirect("/login")
  }

  if (!user.mobile || !user.role) {
    redirect("/complete-profile")
  }

  if (expectedRole && user.role !== expectedRole) {
    redirect("/unauthorized")
  }

  return JSON.parse(JSON.stringify(user)) as PlainCurrentUser
}
