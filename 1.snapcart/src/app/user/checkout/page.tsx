'use client'
import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { ArrowLeft, Building, CreditCard, CreditCardIcon, Home, Loader2, LocateFixed, MapPin, Navigation, Phone, Search, Truck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'

import axios from 'axios'

import dynamic from 'next/dynamic'
import { useDispatch } from 'react-redux'
import { clearCart } from '@/redux/cartSlice'

const CheckOutMap = dynamic(() => import("@/components/CheckoutMap"), { ssr: false })

type AddressForm = {
    fullName: string
    mobile: string
    city: string
    state: string
    pincode: string
    fullAddress: string
}

const initialAddress: AddressForm = {
    fullName: "",
    mobile: "",
    city: "",
    state: "",
    pincode: "",
    fullAddress: ""
}

const validateCheckoutForm = (address: AddressForm, position: [number, number] | null) => {
    if (!address.fullName.trim()) return "Please enter the delivery name."
    if (!address.mobile.trim()) return "Please enter the mobile number."
    if (!/^\d{10}$/.test(address.mobile.trim())) return "Please enter a valid 10-digit mobile number."
    if (!address.fullAddress.trim()) return "Please enter the full delivery address."
    if (!address.city.trim()) return "Please enter the city."
    if (!address.state.trim()) return "Please enter the state."
    if (!address.pincode.trim()) return "Please enter the pincode."
    if (!/^\d{6}$/.test(address.pincode.trim())) return "Please enter a valid 6-digit pincode."
    if (!position) return "Please choose a delivery location on the map."
    return null
}

function Checkout() {
    const router = useRouter()
    const dispatch = useDispatch<AppDispatch>()
    const { userData } = useSelector((state: RootState) => state.user)
    const { subTotal, deliveryFee, finalTotal, cartData } = useSelector((state: RootState) => state.cart)

    const [address, setAddress] = useState<AddressForm>(initialAddress)
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [position, setPosition] = useState<[number, number] | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [checkoutError, setCheckoutError] = useState("")
    const [onlinePaymentAvailable, setOnlinePaymentAvailable] = useState(false)
    const [paymentConfigLoading, setPaymentConfigLoading] = useState(true)

    useEffect(() => {
        if (cartData.length === 0) {
            router.replace("/user/cart")
        }
    }, [cartData.length, router])

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords
                setPosition([latitude, longitude])
            }, (err) => { console.log('location error', err) }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
        }
    }, [])

    useEffect(() => {
        if (userData) {
            setAddress((prev) => ({
                ...prev,
                fullName: userData.name || "",
                mobile: userData.mobile || "",
            }))
        }
    }, [userData])

    useEffect(() => {
        let mounted = true

        const loadPaymentConfig = async () => {
            try {
                const result = await axios.get("/api/user/payment/config")
                if (mounted) {
                    setOnlinePaymentAvailable(Boolean(result.data?.enabled))
                }
            } catch (error) {
                console.log(error)
                if (mounted) {
                    setOnlinePaymentAvailable(false)
                }
            } finally {
                if (mounted) {
                    setPaymentConfigLoading(false)
                }
            }
        }

        void loadPaymentConfig()

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        setCheckoutError("")
    }, [paymentMethod])

    const handleSearchQuery = async () => {
        setSearchLoading(true)
        try {
            const { OpenStreetMapProvider } = await import("leaflet-geosearch")
            const provider = new OpenStreetMapProvider()
            const results = await provider.search({ query: searchQuery })
            if (results?.length) {
                setPosition([results[0].y, results[0].x])
            }
        } catch (error) {
            console.log(error)
        } finally {
            setSearchLoading(false)
        }
    }

    useEffect(() => {
        const fetchAddress = async () => {
            if (!position) return
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
                const resolvedAddress = result.data?.address ?? {}

                setAddress(prev => ({
                    ...prev,
                    city: resolvedAddress.city || resolvedAddress.town || resolvedAddress.village || "",
                    state: resolvedAddress.state || "",
                    pincode: resolvedAddress.postcode || "",
                    fullAddress: result.data?.display_name || ""
                }))
            } catch (error) {
                console.log(error)
            }
        }
        void fetchAddress()
    }, [position])

    const buildPayload = () => ({
        userId: userData?._id,
        items: cartData.map(item => ({
            grocery: item._id,
            name: item.name,
            price: item.price,
            unit: item.unit,
            quantity: item.quantity,
            image: item.image
        })),
        totalAmount: finalTotal,
        address: {
            fullName: address.fullName,
            mobile: address.mobile,
            city: address.city,
            state: address.state,
            fullAddress: address.fullAddress,
            pincode: address.pincode,
            latitude: position?.[0],
            longitude: position?.[1]
        },
        paymentMethod
    })

    const handleCod = async () => {
        if (!position || cartData.length === 0) {
            return null
        }

        const validationError = validateCheckoutForm(address, position)
        if (validationError) {
            setCheckoutError(validationError)
            return null
        }

        try {
            setIsSubmitting(true)
            setCheckoutError("")
            await axios.post("/api/user/order", buildPayload())

            dispatch(clearCart())
            router.replace("/user/orders/success")
        } catch (error) {
            console.log(error)
            if (axios.isAxiosError(error)) {
                setCheckoutError(error.response?.data?.message || "Could not place your order.")
            } else {
                setCheckoutError("Could not place your order.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOnlinePayment = async () => {
        if (!position || cartData.length === 0) {
            return null
        }

        const validationError = validateCheckoutForm(address, position)
        if (validationError) {
            setCheckoutError(validationError)
            return null
        }

        if (!onlinePaymentAvailable) {
            setCheckoutError("Online payment is unavailable right now on this deployment.")
            return null
        }

        try {
            setIsSubmitting(true)
            setCheckoutError("")
            const result = await axios.post("/api/user/payment", buildPayload())
            window.location.href = result.data.url
        } catch (error) {
            console.log(error)
            if (axios.isAxiosError(error)) {
                setCheckoutError(error.response?.data?.message || "Could not start online payment.")
            } else {
                setCheckoutError("Could not start online payment.")
            }
            setIsSubmitting(false)
        }
    }

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords
                setPosition([latitude, longitude])
            }, (err) => { console.log('location error', err) }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
        }
    }

    return (
        <div className='w-[92%] md:w-[80%] mx-auto py-10 relative'>
            <motion.button
                whileTap={{ scale: 0.97 }}
                className='absolute left-0 top-2 flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold'
                onClick={() => router.push("/user/cart")}
            >
                <ArrowLeft size={16} />
                <span>Back to cart</span>
            </motion.button>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='text-3xl md:text-4xl font-bold text-green-700 text-center mb-10'
            >Checkout</motion.h1>

            <div className='grid md:grid-cols-2 gap-8'>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                        <MapPin className='text-green-700' /> Delivery Address
                    </h2>
                    <div className='space-y-4'>
                        <div className='relative'>
                            <User className="absolute left-3 top-3 text-green-600" size={18} />
                            <input type="text" value={address.fullName ?? ""} onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                        </div>
                        <div className='relative'>
                            <Phone className="absolute left-3 top-3 text-green-600" size={18} />
                            <input type="text" value={address.mobile ?? ""} onChange={(e) => setAddress((prev) => ({ ...prev, mobile: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                        </div>
                        <div className='relative'>
                            <Home className="absolute left-3 top-3 text-green-600" size={18} />
                            <input type="text" value={address.fullAddress ?? ""} placeholder='Full Address' onChange={(e) => setAddress((prev) => ({ ...prev, fullAddress: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                        </div>
                        <div className='grid grid-cols-3 gap-3'>
                            <div className='relative'>
                                <Building className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" value={address.city ?? ""} placeholder='city' onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                            <div className='relative'>
                                <Navigation className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" value={address.state ?? ""} placeholder='state' onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                            <div className='relative'>
                                <Search className="absolute left-3 top-3 text-green-600" size={18} />
                                <input type="text" value={address.pincode ?? ""} placeholder='pincode' onChange={(e) => setAddress((prev) => ({ ...prev, pincode: e.target.value }))} className='pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50' />
                            </div>
                        </div>
                        <div className='flex gap-2 mt-3'>
                            <input type="text" placeholder='search city or area...' className='flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <button type="button" className='bg-green-600 text-white px-5 rounded-lg hover:bg-green-700 transition-all font-medium' onClick={handleSearchQuery}>
                                {searchLoading ? <Loader2 size={16} className='animate-spin' /> : "Search"}
                            </button>
                        </div>
                        <div className='relative mt-6 h-[330px] rounded-xl overflow-hidden border border-gray-200 shadow-inner'>
                            {position && <CheckOutMap position={position} setPosition={setPosition} />}
                            <motion.button
                                whileTap={{ scale: 0.93 }}
                                className='absolute bottom-4 right-4 bg-green-600 text-white shadow-lg rounded-full p-3 hover:bg-green-700 transition-all flex items-center justify-center z-999'
                                type="button"
                                onClick={handleCurrentLocation}
                            >
                                <LocateFixed size={22} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 h-fit'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'><CreditCard className='text-green-600' /> Payment Method</h2>
                    <div className='space-y-4 mb-6'>
                        <button
                            type="button"
                            onClick={() => {
                                if (!onlinePaymentAvailable) return
                                setPaymentMethod("online")
                            }}
                            disabled={!onlinePaymentAvailable || paymentConfigLoading}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all disabled:cursor-not-allowed disabled:opacity-60 ${paymentMethod === "online"
                                ? "border-green-600 bg-green-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}>
                            <CreditCardIcon className='text-green-600' />
                            <span className='font-medium text-gray-700'>
                                {paymentConfigLoading
                                    ? "Checking online payment..."
                                    : onlinePaymentAvailable
                                        ? "Pay Online (Card / UPI)"
                                        : "Pay Online (unavailable)"}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("cod")}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "cod"
                                ? "border-green-600 bg-green-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}>
                            <Truck className='text-green-600' /><span className='font-medium text-gray-700'>Cash on Delivery</span>
                        </button>
                    </div>
                    {!paymentConfigLoading && !onlinePaymentAvailable && (
                        <div className='mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800'>
                            Online payment is disabled because Stripe is not configured on this deployment yet.
                        </div>
                    )}
                    <div className='border-t pt-4 text-gray-700 space-y-2 text-sm sm:text-base'>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Subtotal</span>
                            <span className='font-semibold text-green-600'>Rs. {subTotal}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Delivery Fee</span>
                            <span className='font-semibold text-green-600'>Rs. {deliveryFee}</span>
                        </div>
                        <div className='flex justify-between font-bold text-lg border-t pt-3'>
                            <span>Final Total</span>
                            <span className='font-semibold text-green-600'>Rs. {finalTotal}</span>
                        </div>
                    </div>

                    {checkoutError && (
                        <div className='mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>
                            {checkoutError}
                        </div>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.93 }}
                        className='w-full mt-6 bg-green-600 text-white py-3 rounded-full hover:bg-green-700 transition-all font-semibold disabled:cursor-not-allowed disabled:opacity-60'
                        disabled={isSubmitting}
                        onClick={() => {
                            if (paymentMethod == "cod") {
                                void handleCod()
                            } else {
                                void handleOnlinePayment()
                            }
                        }}
                    >
                        {isSubmitting ? "Please wait..." : paymentMethod == "cod" ? "Place Order" : "Pay & Place Order"}
                    </motion.button>
                </motion.div>
            </div>

        </div>
    )
}

export default Checkout
