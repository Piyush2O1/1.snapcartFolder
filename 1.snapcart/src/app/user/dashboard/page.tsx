import Footer from '@/components/Footer'
import GeoUpdater from '@/components/GeoUpdater'
import Nav from '@/components/Nav'
import UserDashboard from '@/components/UserDashboard'
import connectDb from '@/lib/db'
import { getCurrentUserOrRedirect } from '@/lib/currentUser'
import { normalizeCategory } from '@/lib/normalizeCategory'
import Grocery, { IGrocery } from '@/models/grocery.model'

export default async function UserDashboardPage(props: {
  searchParams: Promise<{
    q?: string
    category?: string
  }>
}) {
  const user = await getCurrentUserOrRedirect("user")
  const searchParams = await props.searchParams
  const searchQuery = searchParams.q?.trim() || ""
  const selectedCategory = searchParams.category?.trim() || ""

  await connectDb()

  let groceryList: IGrocery[] = []
  if (selectedCategory) {
    const normalizedSelectedCategory = normalizeCategory(selectedCategory)
    const allGroceries = await Grocery.find({})

    groceryList = normalizedSelectedCategory
      ? allGroceries.filter((grocery) => {
          const normalizedProductCategory = normalizeCategory(grocery.category)

          return (
            normalizedProductCategory === normalizedSelectedCategory ||
            normalizedProductCategory.includes(normalizedSelectedCategory) ||
            normalizedSelectedCategory.includes(normalizedProductCategory)
          )
        })
      : allGroceries
  } else if (searchQuery) {
    groceryList = await Grocery.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { category: { $regex: searchQuery, $options: "i" } },
      ],
    })
  } else {
    groceryList = await Grocery.find({})
  }

  return (
    <>
      <Nav user={user} />
      <GeoUpdater userId={user._id} />
      <UserDashboard groceryList={groceryList} searchQuery={selectedCategory || searchQuery} />
      <Footer role={user.role} />
    </>
  )
}
