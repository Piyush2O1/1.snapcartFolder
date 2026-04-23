import AdminDashboard from '@/components/AdminDashboard'
import Footer from '@/components/Footer'
import GeoUpdater from '@/components/GeoUpdater'
import Nav from '@/components/Nav'
import { getCurrentUserOrRedirect } from '@/lib/currentUser'

export default async function AdminDashboardPage() {
  const user = await getCurrentUserOrRedirect("admin")

  return (
    <>
      <Nav user={user} />
      <GeoUpdater userId={user._id} />
      <AdminDashboard />
      <Footer role={user.role} />
    </>
  )
}
