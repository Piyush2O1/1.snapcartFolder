import { IGrocery } from '@/models/grocery.model'
import { Clock3, ShoppingBag, Truck } from 'lucide-react'

import CategorySlider from './CategorySlider'
import GroceryItemCard from './GroceryItemCard'
import HeroSection from './HeroSection'

type ClientGrocery = Omit<IGrocery, "_id"> & { _id: string }

async function UserDashboard({
  groceryList,
  searchQuery,
}: {
  groceryList: IGrocery[]
  searchQuery: string
}) {
  const plainGrocery = JSON.parse(JSON.stringify(groceryList)) as ClientGrocery[]

  return (
    <main className="min-h-screen pb-16 sm:pb-20">
      <HeroSection searchQuery={searchQuery} inventoryCount={plainGrocery.length} />
      <CategorySlider />

      <section className="mx-auto mt-10 w-[94%] max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { label: "Express delivery lane", value: "10-20 min ready", icon: Clock3 },
            { label: "Customer handoff", value: "OTP verified orders", icon: Truck },
            { label: "Basket flexibility", value: "Quick cart controls", icon: ShoppingBag },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-panel rounded-[28px] p-5">
              <Icon className="h-5 w-5 text-emerald-700" />
              <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 w-[94%] max-w-7xl">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-emerald-700">
              Product Grid
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {searchQuery ? `Matched for "${searchQuery}"` : "Fresh picks for today"}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            {searchQuery
              ? "These items match your current filter and stay fully compatible with cart and checkout flows."
              : "A more polished catalog layout with faster scanning, cleaner pricing, and sharper cart actions."}
          </p>
        </div>

        {plainGrocery.length === 0 ? (
          <div className="glass-panel-strong rounded-[32px] p-10 text-center">
            <p className="font-display text-3xl font-bold text-slate-950">No groceries matched this filter</p>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Try a different keyword or tap one of the featured categories above to reset the browsing flow.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {plainGrocery.map((item) => (
              <GroceryItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default UserDashboard
