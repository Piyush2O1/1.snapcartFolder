import DeliveryBoy from '@/components/DeliveryBoy'
import Footer from '@/components/Footer'
import GeoUpdater from '@/components/GeoUpdater'
import Nav from '@/components/Nav'
import { getCurrentUserOrRedirect } from '@/lib/currentUser'

export default async function DeliveryDashboardPage() {
  const user = await getCurrentUserOrRedirect("deliveryBoy")

  return (
    <>
      <Nav user={user} />
      <GeoUpdater userId={user._id} />
      <DeliveryBoy />
      <Footer role={user.role} />
    </>
  )
}
