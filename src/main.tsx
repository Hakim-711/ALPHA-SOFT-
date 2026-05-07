import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppQueryProvider } from '@/app/providers/query-provider'
import { router } from '@/app/router'
import { AuthProvider } from '@/features/auth/context/auth-context'
import './index.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('لم يتم العثور على عنصر التطبيق الرئيسي')
}

document.documentElement.lang = 'ar'
document.documentElement.dir = 'rtl'

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppQueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppQueryProvider>
  </React.StrictMode>,
)
