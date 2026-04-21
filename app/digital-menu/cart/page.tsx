'use client';

import CartPage from '@/components/Cart'
import { store } from '@/lib/redux/store'
import React from 'react'
import { Provider } from 'react-redux'

export default function Page() {
  return (
    <Provider store={store}>
      <CartPage/>
    </Provider>
  )
}
