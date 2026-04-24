'use client'

import Image from 'next/image'
import { Minus, Plus, ShoppingCart, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useDispatch, useSelector } from 'react-redux'

import { addToCart, decreaseQuantity, increaseQuantity } from '@/redux/cartSlice'
import { AppDispatch, RootState } from '@/redux/store'

interface IGrocery {
  _id: string
  name: string
  category: string
  price: string
  unit: string
  image: string
  createdAt?: Date
  updatedAt?: Date
}

function GroceryItemCard({ item }: { item: IGrocery }) {
  const dispatch = useDispatch<AppDispatch>()
  const { cartData } = useSelector((state: RootState) => state.cart)
  const cartItem = cartData.find((i) => i._id.toString() === item._id)

  return (
    <motion.article
      initial={{ opacity: 0, y: 34, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true, amount: 0.16 }}
      className="glass-panel group overflow-hidden rounded-[30px]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.8))]">
        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Fresh pick
        </div>
        <Image
          src={item.image}
          fill
          alt={item.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-contain p-5 transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{item.category}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">
              {item.name}
            </h3>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {item.unit}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Quick Basket price</p>
            <p className="text-3xl font-bold tracking-tight text-slate-950">Rs. {item.price}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            Ready for cart
          </div>
        </div>

        {!cartItem ? (
          <motion.button
            suppressHydrationWarning
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch(addToCart({ ...item, quantity: 1 }))}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5 flex items-center justify-between rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2"
          >
            <button
              suppressHydrationWarning
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-100"
              onClick={() => dispatch(decreaseQuantity(item._id))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-950">{cartItem.quantity}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">in cart</p>
            </div>
            <button
              suppressHydrationWarning
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-100"
              onClick={() => dispatch(increaseQuantity(item._id))}
            >
              <Plus className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.article>
  )
}

export default GroceryItemCard
