import { useState } from 'react';
import { Link } from 'react-router';
import SiteHeader from '../components/SiteHeader.jsx';
import Footer from '../components/Footer.jsx';
import {
  ArrowRight,
  ChevronRight,
  Minus,
  Package,
  PackageOpen,
  Plus,
} from 'lucide-react';

import { useCart } from '../context/CartContext.jsx';
import './CartPage.css';

function formatPrice(price) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(price);
}

function CartPage() {

  const {
    cartItems,
    cartSubtotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  return (
    <div className="cart-page">
      <SiteHeader />

      <section className="cart-introduction">
        <div className="cart-container">
          <div className="cart-breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={15} />
            <span>Cart</span>
          </div>

          <div className="cart-title-row">
            <h1 className="cart-page-title">Cart</h1>

            <p className="cart-page-subtitle">
              <Link to="/products">Continue Shopping</Link>
            </p>
          </div>
        </div>
      </section>

      <main className="cart-main">
        <div className="cart-container">

          {cartItems.length === 0 ? (
            <section className="cart-empty">
              <div className="cart-empty-icon">
                <PackageOpen
                  size={42}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              </div>

              <p className="cart-empty-label">
                Nothing here yet
              </p>

              <h2>Your cart is empty</h2>

              <p className="cart-empty-description">
                Browse our products and add the everyday essentials
                you need.
              </p>

              <Link to="/products" className="cart-shop-link">
                Browse Products
                <ArrowRight size={17} strokeWidth={2} />
              </Link>
            </section>
          ) : (
            <>
              <div className="cart-layout">
                <section className="cart-items">
                  <div className="cart-table-header">
                    <span className="cart-header-product">Product</span>
                    <span>Price</span>
                    <span>Quantity</span>
                    <span>Total</span>
                  </div>

                  <div className="cart-products-list">
                    {cartItems.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-item-visual">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                          />
                        ) : (
                          <Package
                            size={36}
                            strokeWidth={1.4}
                            aria-label="No product image"
                          />
                        )}
                      </div>

                      <div className="cart-item-information">
                        <p className="cart-item-category">
                          {item.category}
                        </p>

                        <h2>{item.name}</h2>

                        <button
                          type="button"
                          className="cart-item-remove-text"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>

                        <p className="cart-item-price">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="cart-item-price-column">
                        {formatPrice(item.price)}
                      </div>

                      <div className="cart-quantity-control">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity - 1,
                            )
                          }
                        >
                          <Minus size={16} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1,
                            )
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="cart-item-total">
                        <strong>
                          {formatPrice(item.price * item.quantity)}
                        </strong>
                      </div>

                    </article>
                  ))}
                  </div>

                </section>
              </div>

              <aside className="cart-summary">
                <h2>Order Summary</h2>

                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <strong className="cart-summary-subtotal">
                    {formatPrice(cartSubtotal)}
                  </strong>
                </div>

                <div className="cart-summary-total">
                  <span>Subtotal</span>
                  <strong>{formatPrice(cartSubtotal)}</strong>
                </div>

                <p className="cart-summary-note">
                  Delivery fees are calculated at checkout.
                </p>

                <Link to="/checkout" className="cart-checkout-button">
                  CHECKOUT
                </Link>

                <Link to="/products" className="cart-continue-link">
                  Continue Shopping
                </Link>
              </aside>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CartPage;
