import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { getPostAuthPath } from '@/lib/appRoutes'
import connectDb from '@/lib/db'
import { isDatabaseUnavailable } from '@/lib/dbError'
import User from '@/models/user.model'

export default async function AuthRedirectPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?reauth=1")
  }

  try {
    await connectDb()
    const user = await User.findById(session.user.id)

    if (!user) {
      redirect("/login?reauth=1")
    }

    redirect(
      getPostAuthPath({
        role: user.role,
        mobile: user.mobile,
      }),
    )
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      redirect("/login?error=database_unavailable&reauth=1")
    }

    throw error
  }
}
