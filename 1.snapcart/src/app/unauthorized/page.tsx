import Link from 'next/link'
import React from 'react'

function Unauthorized() {
  return (
    <div className='flex h-screen flex-col items-center justify-center bg-gray-100 px-6 text-center'>
      <h1 className='text-3xl font-bold text-red-600'>Access Denied</h1>
      <p className='mt-2 text-gray-700'>You can not access this page with your current role.</p>
      <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
        <Link href='/' className='rounded-full bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700'>
          Go Home
        </Link>
        <Link href='/login' className='rounded-full bg-white px-5 py-2 font-semibold text-gray-700 shadow hover:bg-gray-50'>
          Login
        </Link>
      </div>
    </div>
  )
}

export default Unauthorized
