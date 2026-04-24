'use client'

import Link from 'next/link'
import { Facebook, Instagram, Mail, MapPin, Phone, TwitterIcon } from 'lucide-react'
import { motion } from 'motion/react'

import BrandMark from './BrandMark'

type Role = "user" | "deliveryBoy" | "admin" | "guest"

function Footer({ role = "guest" }: { role?: Role }) {
  const quickLinks =
    role === "admin"
      ? [
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Add Grocery", href: "/admin/groceries/add" },
          { label: "Manage Orders", href: "/admin/orders" },
        ]
      : role === "deliveryBoy"
        ? [
            { label: "Dashboard", href: "/delivery/dashboard" },
            { label: "Today Earning", href: "/delivery/insights/today-earning" },
            { label: "Completed Orders", href: "/delivery/insights/total-completed" },
          ]
        : role === "user"
          ? [
              { label: "Dashboard", href: "/user/dashboard" },
              { label: "Cart", href: "/user/cart" },
              { label: "My Orders", href: "/user/orders" },
            ]
          : [
              { label: "Home", href: "/" },
              { label: "Login", href: "/login?reauth=1" },
              { label: "Sign Up", href: "/register?reauth=1" },
            ]

  return (
    <motion.footer
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="px-4 pb-6 pt-16 sm:pt-20"
    >
      <div className="glass-panel-dark mx-auto max-w-7xl overflow-hidden rounded-[34px] p-8 text-white sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.9fr]">
          <div className="space-y-5">
            <BrandMark light />
            <p className="max-w-md text-sm leading-7 text-white/70 sm:text-base">
              Quick Basket is built for a faster grocery shopping experience with smoother order operations, cleaner delivery handoff, and a more premium brand presence.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80">
              Responsive, branded, and ready for production polish
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-white">Quick Links</h2>
            <div className="mt-4 grid gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white/78 transition hover:bg-white/12 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-xl font-semibold text-white">Contact</h3>
            <div className="mt-4 space-y-3 text-sm text-white/75">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-emerald-300" />
                Mumbai, India
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-emerald-300" />
                +91 0000000000
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-emerald-300" />
                support@quickbasket.in
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, TwitterIcon].map((Icon, index) => (
                <Link
                  key={index}
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white/75 transition hover:bg-white/14 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-sm text-white/55">
          {new Date().getFullYear()} Quick Basket. All rights reserved.
        </div>
      </div>
    </motion.footer>
  )
}

export default Footer
