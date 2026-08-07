import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Package, PackageOpen } from 'lucide-react';

import SiteHeader from '../components/SiteHeader.jsx';
import Footer from '../components/Footer.jsx';
import './OrdersPage.css';
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const ORDERS_STORAGE_KEY = 'evelyns-store-orders';

function getSavedOrders() {
  try {
    const savedOrders = localStorage.getItem(
      ORDERS_STORAGE_KEY,
    );

    const parsedOrders = savedOrders
      ? JSON.parse(savedOrders)
      : [];

    return Array.isArray(parsedOrders)
      ? parsedOrders
      : [];
  } catch {
    return [];
  }
}

function formatPrice(value) {
  const safeValue = Number(value) || 0;

  return `₱${safeValue.toFixed(2)}`;
}

function formatOrderDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getOrderStatus(order) {
  return String(order.status || 'Pending').trim();
}

function getStatusClass(status) {
  return status
    .toLowerCase()
    .replaceAll(' ', '-');
}

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setOrders(getSavedOrders());
        return;
      }

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select('*')
        .eq("auth_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load orders:", error);
        setOrders(getSavedOrders());
        return;
      }

      if (!ordersData?.length) {
        setOrders(getSavedOrders());
        return;
      }

      const orderIds = ordersData.map((order) => order.id);
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      const formattedOrders = ordersData.map((order) => ({
        id: order.id,
        orderNumber: order.order_number || `ORDER-${order.id}`,
        createdAt: order.created_at,
        status: order.status,
        fulfillmentMethod: order.fulfillment_method,
        subtotal: order.subtotal,
        deliveryFee: order.delivery_fee,
        total: order.total,
        address: order.address,
        notes: order.notes,

        items: (itemsData || [])
          .filter((item) => String(item.order_id) === String(order.id))
          .map((item) => ({
          id: item.id,
          productId: item.product_id,
          name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          })),
      }));

      setOrders(formattedOrders);
    }

    loadOrders();
  }, [user]);

  const sortedOrders = [...orders].sort((first, second) => {
    const firstDate = new Date(first.createdAt).getTime() || 0;
    const secondDate =
      new Date(second.createdAt).getTime() || 0;

    return sortOrder === 'newest'
      ? secondDate - firstDate
      : firstDate - secondDate;
  });

  return (
    <div className="orders-page">
      <SiteHeader />

      <section className="orders-introduction">
        <div className="orders-container">
          <nav
            className="orders-breadcrumb"
            aria-label="Breadcrumb"
          >
            <Link to="/">Home</Link>

            <ChevronRight
              size={15}
              aria-hidden="true"
            />

            <span aria-current="page">
              My Orders
            </span>
          </nav>

          <div className="orders-title-row">
            <h1 className="orders-page-title">
              Orders
            </h1>

            <p className="orders-page-subtitle">
              Track your purchases and review the details of every order.
            </p>
          </div>
        </div>
      </section>

      <main className="orders-main">
        <div className="orders-container">
          {sortedOrders.length === 0 ? (
            <section className="orders-empty">
              <div className="orders-empty-icon">
                <PackageOpen
                  size={42}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              </div>

              <p className="orders-empty-label">
                No orders yet
              </p>

              <h2>Your order history is empty</h2>

              <p className="orders-empty-description">
                Products you order from Evelyn&apos;s Store
                will appear here.
              </p>

              <Link
                to="/products"
                className="orders-shop-button"
              >
                Browse Products
                <ChevronRight size={17} />
              </Link>
            </section>
          ) : (
            <section className="orders-history-panel">
              <div className="orders-sort-row">
                <label htmlFor="orders-sort">Sort by:</label>
                <select
                  id="orders-sort"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <div className="orders-list">
                {sortedOrders.map((order, index) => {
                  const orderId = order.id || order.orderNumber || `order-${index}`;
                  const status = getOrderStatus(order);
                  const itemCount = Array.isArray(order.items) ? order.items.length : 0;

                  return (
                    <article className="order-history-row" key={orderId} id={`order-${orderId}`}>
                      <div className="order-history-icon"><Package size={29} aria-hidden="true" /></div>
                      <div className="order-history-info">
                        <strong>{order.orderNumber || `ORDER-${index + 1}`}</strong>
                        <span>{formatOrderDate(order.createdAt)}</span>
                        <small>{itemCount} {itemCount === 1 ? 'item' : 'items'}</small>
                      </div>
                      <span className={`order-history-status order-status-${getStatusClass(status)}`}>{status}</span>
                      <strong className="order-history-total">{formatPrice(order.total)}</strong>
                      <a className="order-history-link" href={`#order-${orderId}`}>
                        View Details
                        <ChevronRight size={18} aria-hidden="true" />
                      </a>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OrdersPage;
