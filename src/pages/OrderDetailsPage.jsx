import { Link, useLocation, useParams } from 'react-router';
import {
  ChevronRight,
  NotebookText,
  Package,
  Store,
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
  const normalizedOrderStatus = String(order.status || '').toLowerCase();
  const paymentStatus = order.paymentStatus || order.payment_status || (
    normalizedOrderStatus === 'cancelled' || normalizedOrderStatus === 'canceled'
      ? 'Unpaid'
      : normalizedOrderStatus === 'completed' || normalizedOrderStatus === 'delivered'
        ? 'Paid'
        : 'Pending'
  );
  const paymentStatusClass = String(paymentStatus).toLowerCase().replace(/\s+/g, '-');

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
        <div className="order-details-content order-details-container">
          <section className="order-details-overview-card">
            <div className="order-details-identity">
              <div className="order-details-package"><Package size={31} aria-hidden="true" /></div>
              <div>
                <h2>{order.orderNumber || `ORDER-${order.id}`}</h2>
                <p>{formatDate(order.createdAt)}</p>
                <span>{order.status || 'Preparing'}</span>
              </div>
            </div>

            <div className="order-details-fact">
              <Store size={25} aria-hidden="true" />
              <div>
                <h3>Fulfillment</h3>
                <p>{isDelivery ? 'Delivery' : 'Store Pickup'}</p>
              </div>
            </div>

            <div className="order-details-fact">
              <WalletCards size={25} aria-hidden="true" />
              <div>
                <h3>Payment Method</h3>
                <p>{order.paymentMethod || (isDelivery ? 'Cash on Delivery' : 'Cash')}</p>
              </div>
            </div>

            <div className="order-details-payment-status">
              <small>Payment Status</small>
              <strong className={`payment-status-${paymentStatusClass}`}>{paymentStatus}</strong>
            </div>
          </section>

          <section className="order-details-notes">
            <NotebookText size={25} aria-hidden="true" />
            <div>
              <h3>Order Notes</h3>
              <p>{order.notes || 'No additional notes.'}</p>
            </div>
          </section>

          <section className="order-details-items-card">
            <h3>Items ({items.length})</h3>

            <div className="order-details-table-heading" aria-hidden="true">
              <span>Item</span>
              <span>Unit Price</span>
              <span>Qty</span>
              <span>Total</span>
            </div>

            <div className="order-details-items-list">
              {items.map((item, index) => {
                const quantity = Number(item.quantity) || 1;
                const itemTotal = (Number(item.price) || 0) * quantity;
                return (
                  <article className="order-details-item" key={item.id || index}>
                    <div className="order-details-item-product">
                      {item.image ? <img src={item.image} alt={item.name} /> : <div><Package size={23} /></div>}
                      <p>
                        <strong>{item.name}</strong>
                        <span>{item.category || item.categoryName || 'Product'}</span>
                      </p>
                    </div>
                    <span>{formatPrice(item.price)}</span>
                    <span>{quantity}</span>
                    <strong>{formatPrice(itemTotal)}</strong>
                  </article>
                );
              })}
            </div>

            <div className="order-details-summary">
              <p><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p>
              <p><span>Delivery Fee</span><strong>{deliveryFee ? formatPrice(deliveryFee) : 'Free'}</strong></p>
              <p className="order-details-summary-total"><span>Total Paid</span><strong>{formatPrice(total)}</strong></p>
            </div>
          </section>

          <div className="order-details-actions">
            <Link to="/products" className="order-details-order-again">
              Order Again
            </Link>
            <Link to="/orders" className="order-details-back-button">Back</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OrderDetailsPage;
