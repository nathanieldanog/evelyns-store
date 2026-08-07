import { Link, useLocation } from 'react-router';
import {
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  ReceiptText,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';

import SiteHeader from '../components/SiteHeader.jsx';
import Footer from '../components/Footer.jsx';
import './OrderConfirmationPage.css';

function getSavedOrder() {
  try {
    const savedOrder = localStorage.getItem(
      'evelyns-store-last-order',
    );

    return savedOrder ? JSON.parse(savedOrder) : null;
  } catch {
    return null;
  }
}

function OrderConfirmationPage() {
  const location = useLocation();

  const order = location.state?.order || getSavedOrder();

  if (!order) {
    return (
      <div className="order-confirmation-page">
        <SiteHeader />

        <main className="order-not-found">
          <div className="order-not-found-card">
            <ReceiptText size={52} strokeWidth={1.5} />

            <h1>No recent order found</h1>

            <p>
              Place an order first to view its confirmation.
            </p>

            <Link to="/products">Browse Products</Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const isDelivery =
    order.fulfillmentMethod === 'delivery';

  const formattedDate = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(order.createdAt));

  return (
    <div className="order-confirmation-page">
      <SiteHeader />

      <section className="order-confirmation-introduction">
        <div className="order-confirmation-header-container">
          <nav
            className="confirmation-breadcrumb"
            aria-label="Breadcrumb"
          >
            <Link to="/">Home</Link>

            <ChevronRight size={15} aria-hidden="true" />

            <Link to="/cart">Cart</Link>

            <ChevronRight size={15} aria-hidden="true" />

            <Link to="/checkout">Checkout</Link>

            <ChevronRight size={15} aria-hidden="true" />

            <span aria-current="page">
              Order Successful
            </span>
          </nav>

          <div className="confirmation-title-row">
            <h1>Order Successful</h1>
            <p>Your order has been received and is now being prepared.</p>
          </div>
        </div>
      </section>

      <main className="order-confirmation-main">
        <div className="order-confirmation-container">
          <section className="order-success-card">
            <div className="order-success-icon">
              <Check size={34} strokeWidth={2.5} />
            </div>

            <p className="order-success-label">
              Order successfully placed
            </p>

            <h1>Thank you, {order.customer.name}!</h1>

            <p className="order-success-message">
              Evelyn’s Store has received your order. Please keep
              your order number for reference.
            </p>

            <div className="order-number-box">
              <span>Order number</span>
              <strong>{order.orderNumber}</strong>
            </div>
          </section>

          <div className="order-confirmation-layout">
            <section className="order-details-card">
              <div className="order-card-heading">
                <Package size={21} />
                <h2>Ordered Products</h2>
              </div>

              <div className="order-products-list">
                {order.items.map((item) => (
                  <div className="order-product-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        ₱{item.price.toFixed(2)} × {item.quantity}
                      </span>
                    </div>

                    <strong>
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="order-total-section">
                <div>
                  <span>Subtotal</span>
                  <strong>₱{order.subtotal.toFixed(2)}</strong>
                </div>

                <div>
                  <span>Delivery fee</span>
                  <strong>
                    {order.deliveryFee === 0
                      ? 'Free'
                      : `₱${order.deliveryFee.toFixed(2)}`}
                  </strong>
                </div>

                <div className="order-grand-total">
                  <span>Total</span>
                  <strong>₱{order.total.toFixed(2)}</strong>
                </div>
              </div>
            </section>

            <aside className="order-information-card">
              <div className="order-card-heading">
                <ReceiptText size={21} />
                <h2>Order Information</h2>
              </div>

              <div className="order-information-list">
                <div className="order-information-row">
                  <Clock3 size={18} />

                  <div>
                    <span>Date placed</span>
                    <strong>{formattedDate}</strong>
                  </div>
                </div>

                <div className="order-information-row">
                  {isDelivery ? (
                    <Truck size={18} />
                  ) : (
                    <Store size={18} />
                  )}

                  <div>
                    <span>Order method</span>
                    <strong>
                      {isDelivery
                        ? 'Local Delivery'
                        : 'Store Pickup'}
                    </strong>
                  </div>
                </div>

                {isDelivery && (
                  <div className="order-information-row">
                    <MapPin size={18} />

                    <div>
                      <span>Delivery address</span>
                      <strong>{order.address}</strong>
                    </div>
                  </div>
                )}

                <div className="order-information-row">
                  <ShoppingBag size={18} />

                  <div>
                    <span>Payment</span>
                    <strong>
                      Cash on{' '}
                      {isDelivery ? 'delivery' : 'pickup'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="order-preparation-notice">
                <Clock3 size={19} />

                <div>
                  <strong>Estimated preparation time</strong>
                  <span>
                    {isDelivery
                      ? '30–60 minutes'
                      : '15–30 minutes'}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="order-notes">
                  <strong>Order notes</strong>
                  <p>{order.notes}</p>
                </div>
              )}
            </aside>
          </div>

          <div className="order-confirmation-actions">
            <Link
              to="/products"
              className="order-continue-button"
            >
              Continue Shopping
            </Link>

            <Link
              to="/orders"
              className="order-view-orders-button"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default OrderConfirmationPage;
