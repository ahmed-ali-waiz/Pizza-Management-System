import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Riders from './pages/Riders';
import KDS from './pages/KDS';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Marketing from './pages/Marketing';
import Operations from './pages/Operations';
import Quality from './pages/Quality';
import Financial from './pages/Financial';
import System from './pages/System';
import Checkout from './pages/Checkout';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { theme } = useSelector((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="branches" element={<Branches />} />
            <Route path="menu" element={<Menu />} />
            <Route path="orders" element={<Orders />} />
            <Route path="payments" element={<Payments />} />
            <Route path="riders" element={<Riders />} />
            <Route path="kds" element={<KDS />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="operations" element={<Operations />} />
            <Route path="quality" element={<Quality />} />
            <Route path="financial" element={<Financial />} />
            <Route path="system" element={<System />} />
            <Route path="checkout/:orderId" element={<Checkout />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: theme === 'dark' ? '#374151' : '#fff',
            color: theme === 'dark' ? '#fff' : '#000',
          },
        }}
      />
    </>
  );
}

export default App;