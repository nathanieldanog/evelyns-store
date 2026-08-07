import { Link, useLocation, useParams } from 'react-router';
import {
  ArrowLeft,
  ChevronRight,
  Package,
  RotateCcw,
  WalletCards,
} from 'lucide-react';

import SiteHeader from '../components/SiteHeader.jsx';
import Footer from '../components/Footer.jsx';
import './OrderDetailsPage.css';

const ORDERS_STORAGE_KEY = 'evelyns-store-orders';

function getSavedOrder(orderId) {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
    return orders.find(
      (order) => String(order.id || order.orderNumber) === String(orderId),
    ) || null;
  } catch {
    return null;
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value) || 0);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
}

function OrderDetailsPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state?.order || getSavedOrder(orderId);

  if (!order) {
    return (
      <div className="order-details-page">
        <SiteHeader />
        <main className="order-details-not-found">
          <h1>Order not found</h1>
          <p>Return to My Orders and select an order to view its details.</p>
          <Link to="/orders">Back to My Orders</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal) || items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0,
  );
  const deliveryFee = Number(order.deliveryFee) || 0;
  const total = Number(order.total) || subtotal + deliveryFee;
  const isDelivery = order.fulfillmentMethod === 'delivery';

  return (
    <div className="order-details-page">
      <SiteHeader />

      <section className="order-details-introduction">
        <div className="order-details-container">
          <nav className="order-details-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={15} aria-hidden="true" />
            <Link to="/orders">My Orders</Link>
            <ChevronRight size={15} aria-hidden="true" />
            <span>{order.orderNumber || `ORDER-${order.id}`}</span>
          </nav>
          <div className="order-details-title-row">
            <h1>Orders</h1>
            <p>Track your purchases and review the details of every order.</p>
          </div>
        </div>
      </section>

      <main className="order-details-main">
        <section className="order-details-card order-details-container">
          <div className="order-details-overview">
            <div className="order-details-package"><Package size={33} aria-hidden="true" /></div>
            <div>
              <h2>{order.orderNumber || `ORDER-${order.id}`}</h2>
              <p>{formatDate(order.createdAt)}</p>
              <span>{order.status || 'Preparing'}</span>
            </div>
            <div className="order-details-total-paid">
              <small>Total Paid</small>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>

          <div className="order-details-information">
            <div>
              <h3>{isDelivery ? 'Delivery Address' : 'Fulfillment'}</h3>
              <p>{isDelivery ? order.address || 'Address not provided' : 'Store Pickup'}</p>
            </div>
            <div>
              <h3>Payment Method</h3>
              <p><WalletCards size={18} aria-hidden="true" /> {order.paymentMethod || (isDelivery ? 'Cash on Delivery' : 'Cash on Pickup')}</p>
            </div>
            <div>
              <h3>Order Notes</h3>
              <p>{order.notes || 'No additional notes.'}</p>
            </div>
          </div>

          <section className="order-details-items-section">
            <h3>Items ({items.length})</h3>
            {items.map((item, index) => (
              <article className="order-details-item" key={item.id || index}>
                {item.image ? <img src={item.image} alt={item.name} /> : <div><Package size={23} /></div>}
                <p><strong>{item.name}</strong><span>{formatPrice(item.price)} &times; {Number(item.quantity) || 1}</span></p>
                <strong>{formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1))}</strong>
              </article>
            ))}
          </section>

          <div className="order-details-summary-row">
            <div className="order-details-summary-actions">
              <Link to="/products" className="order-details-order-again">
                <RotateCcw size={16} aria-hidden="true" />
                Order Again
              </Link>
              <Link to="/orders" className="order-details-back-button">
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </Link>
            </div>
            <div className="order-details-summary">
              <p><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p>
              <p><span>Delivery Fee</span><strong>{deliveryFee ? formatPrice(deliveryFee) : 'Free'}</strong></p>
              <p className="order-details-summary-total"><span>Total Paid</span><strong>{formatPrice(total)}</strong></p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default OrderDetailsPage;
