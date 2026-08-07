import { Routes, Route } from 'react-router';
import App from './App.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import { Navigate } from "react-router";
import { useAuth } from "./context/AuthContext";

function AppRoutes() {
  const { profile, loading } = useAuth();

  if (loading) {
    return null;
  }
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/order-confirmation"
        element={<OrderConfirmationPage />}
      />
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/admin"
        element={
          profile?.role === "admin"
            ? <AdminPage />
            : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

export default AppRoutes;