import { Link, useLocation, useParams } from 'react-router';
import { ArrowLeft, Banknote, ChevronRight, Copy, ExternalLink, Info, Package, ReceiptText, Store } from 'lucide-react';
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

function formatOrderDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value) || 0);
}

function OrderDetailsPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state?.order || getSavedOrder(orderId);
  const displayOrderId = order?.orderNumber || (orderId ? decodeURIComponent(orderId) : 'Order ID unavailable');
  const orderStatus = String(order?.status || 'Pending').trim();
  const orderStatusClass = orderStatus.toLowerCase().replaceAll(' ', '-');
  const items = Array.isArray(order?.items) ? order.items : [];
  const orderSubtotal = Number(order?.subtotal) || items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0,
  );
  const deliveryFee = Number(order?.deliveryFee ?? order?.delivery_fee) || 0;
  const voucherDiscount = Number(order?.voucherDiscount ?? order?.discount ?? order?.discount_amount) || 0;
  const totalAmountPaid = Number(order?.total) || orderSubtotal + deliveryFee - voucherDiscount;
  const paymentMethod = order?.paymentMethod || order?.payment_method || 'Cash on Delivery';
  const fulfillmentMethod = order?.fulfillmentMethod || order?.fulfillment_method || order?.shippingMethod || 'Store Pickup';

  function copyOrderId() {
    navigator.clipboard?.writeText(displayOrderId);
  }

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
            <span aria-current="page">Order Details</span>
          </nav>

          <div className="order-details-title-row">
            <h1>Orders</h1>
            <p>Track your purchases and review the details of every order.</p>
          </div>

          <div className="order-details-back-row">
            <Link to="/orders" aria-label="Back to My Orders" title="Back to My Orders">
              <ArrowLeft size={24} aria-hidden="true" />
            </Link>
          </div>

          <div className="order-details-order-id-row">
            <div className="order-details-order-id-copy">
              <strong>{displayOrderId}</strong>
              <button type="button" onClick={copyOrderId} aria-label="Copy order ID" title="Copy order ID">
                <Copy size={20} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="order-details-order-meta">
            <span className={`order-details-order-status order-status-${orderStatusClass}`}>{orderStatus}</span>
            <span className="order-details-order-date">
              {formatOrderDate(order?.createdAt || order?.created_at)}
            </span>
            <button className="order-details-invoice-button" type="button" onClick={() => window.print()}>
              View invoice <ExternalLink size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <main className="order-details-main">
        <div className="order-details-lower-layout order-details-container">
          <section className="order-details-items-section">
            <div className="order-details-items-table-header" aria-hidden="true">
              <span className="order-details-item-product-heading">Items Ordered</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>

            <div className="order-details-items-list">
              {items.length ? items.map((item, index) => {
                const quantity = Number(item.quantity) || 1;
                const itemTotal = (Number(item.price) || 0) * quantity;

                return (
                  <article className="order-details-item-row" key={item.id || index}>
                    <div className="order-details-item-visual">
                      {item.image ? <img src={item.image} alt={item.name} /> : <Package size={28} aria-hidden="true" />}
                    </div>
                    <h3>{item.name || 'Product'}</h3>
                    <span className="order-details-item-price">{formatPrice(item.price)}</span>
                    <span className="order-details-item-quantity">{quantity}</span>
                    <strong className="order-details-item-total">{formatPrice(itemTotal)}</strong>
                  </article>
                );
              }) : (
                <p className="order-details-items-empty">No ordered items available.</p>
              )}
            </div>
          </section>

          <div className="order-details-side-panel">
            <aside className="order-details-summary-card">
              <h2><ReceiptText size={23} aria-hidden="true" />Summary</h2>
              <p><span>Order Total</span><strong>{formatPrice(orderSubtotal)}</strong></p>
              <p><span>Delivery Fee</span><strong>{deliveryFee ? formatPrice(deliveryFee) : 'Free'}</strong></p>
              <p className="order-details-voucher-discount"><span>Voucher Discount</span><strong>-{formatPrice(voucherDiscount)}</strong></p>
              <p className="order-details-summary-paid"><span>Total Amount Paid</span><strong>{formatPrice(totalAmountPaid)}</strong></p>
            </aside>

            <aside className="order-details-methods-card">
              <h2><Info size={24} aria-hidden="true" />Order Information</h2>
              <p><Banknote size={23} aria-hidden="true" /><span>Payment Method<strong>{paymentMethod}</strong></span></p>
              <p><Store size={23} aria-hidden="true" /><span>Fulfilment Method<strong>{fulfillmentMethod}</strong></span></p>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OrderDetailsPage;
