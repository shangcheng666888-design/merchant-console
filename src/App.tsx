import type React from 'react'
import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { ToastProvider } from './components/ToastProvider'

const MerchantBackendLayout = lazy(() => import('./components/MerchantBackendLayout'))
const MerchantLogin = lazy(() => import('./pages/MerchantLogin'))
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard'))
const MerchantOrders = lazy(() => import('./pages/MerchantOrders'))
const MerchantWarehouse = lazy(() => import('./pages/MerchantWarehouse'))
const MerchantPlan = lazy(() => import('./pages/MerchantPlan'))
const MerchantFinance = lazy(() => import('./pages/MerchantFinance'))
const MerchantSettings = lazy(() => import('./pages/MerchantSettings'))
const MerchantWallet = lazy(() => import('./pages/MerchantWallet'))
const MerchantWalletRecharge = lazy(() => import('./pages/MerchantWalletRecharge'))
const MerchantWalletWithdraw = lazy(() => import('./pages/MerchantWalletWithdraw'))

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    document.getElementById('root')?.scrollTo(0, 0)
  }, [pathname])
  return null
}

const PageLoadFallback: React.FC = () => (
  <div className="merchant-backend" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    加载中…
  </div>
)

const App: React.FC = () => (
  <ToastProvider>
    <ScrollToTop />
    <Suspense fallback={<PageLoadFallback />}>
      <Routes>
        <Route path="/login" element={<MerchantLogin />} />
        <Route path="/" element={<MerchantBackendLayout />}>
          <Route path="dashboard" element={<MerchantDashboard />} />
          <Route path="orders" element={<MerchantOrders />} />
          <Route path="warehouse" element={<MerchantWarehouse />} />
          <Route path="plan" element={<MerchantPlan />} />
          <Route path="finance" element={<MerchantFinance />} />
          <Route path="wallet" element={<Outlet />}>
            <Route index element={<MerchantWallet />} />
            <Route path="recharge" element={<MerchantWalletRecharge />} />
            <Route path="withdraw" element={<MerchantWalletWithdraw />} />
          </Route>
          <Route path="settings" element={<MerchantSettings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  </ToastProvider>
)

export default App
