import Footer from '@/components/Footer'
import GeoUpdater from '@/components/GeoUpdater'
import Nav from '@/components/Nav'
import UserDashboard from '@/components/UserDashboard'
import connectDb from '@/lib/db'
import { getCurrentUserOrRedirect } from '@/lib/currentUser'
import Grocery, { IGrocery } from '@/models/grocery.model'

export default async function UserDashboardPage(props: {
  searchParams: Promise<{
    q?: string
  }>
}) {
  const user = await getCurrentUserOrRedirect("user")
  const searchParams = await props.searchParams

  await connectDb()

  let groceryList: IGrocery[] = []
  if (searchParams.q) {
    groceryList = await Grocery.find({
      $or: [
        { name: { $regex: searchParams.q || "", $options: "i" } },
        { category: { $regex: searchParams.q || "", $options: "i" } },
      ],
    })
  } else {
    groceryList = await Grocery.find({})
  }

  return (
    <>
      <Nav user={user} />
      <GeoUpdater userId={user._id} />
      <UserDashboard groceryList={groceryList} searchQuery={searchParams.q || ""} />
      <Footer role={user.role} />
    </>
  )
}
