import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Banknote,
  ChevronRight,
  ClipboardCheck,
  CircleAlert,
  MapPin,
  PackageCheck,
  Store,
  Truck,
} from 'lucide-react';

import SiteHeader from '../components/SiteHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useCart } from '../context/CartContext.jsx';
import './CheckoutPage.css';
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const MINIMUM_DELIVERY_FEE = 40;

function normalizeLocation(value = '') {
  return value.toLowerCase().replace(/barangay|city/g, '').replace(/[^a-z0-9]/g, '');
}

function calculateLocalDeliveryQuote({ address, city, barangay }) {
  const normalizedCity = normalizeLocation(city);
  const normalizedBarangay = normalizeLocation(barangay);
  const normalizedAddress = normalizeLocation(address);
  const hasLocation = Boolean(normalizedCity || normalizedBarangay || normalizedAddress);
  const isInBarangay = (areas) => areas.some((area) => normalizedBarangay === area);
  const addressMentions = (areas) => areas.some((area) => normalizedAddress.includes(area));

  // Store location: 192-B Guiho St., Cembo, Makati City.
  if (!hasLocation) return { fee: MINIMUM_DELIVERY_FEE, zone: 'Starting rate' };

  if (isInBarangay(['cembo', 'southcembo', 'westrembo', 'eastrembo', 'comembo', 'pembo', 'pitogo']) ||
      (normalizedCity === 'makati' && isInBarangay(['rizal', 'postpropernorth', 'postpropersouth']))) {
    return { fee: 40, zone: 'Zone 1 · Cembo and nearby barangays' };
  }

  if (normalizedCity === 'makati' ||
      (normalizedCity === 'taguig' && (isInBarangay(['fortbonifacio', 'westernbicutan', 'upperbicutan']) || addressMentions(['bgc', 'fortbonifacio'])))) {
    return { fee: 50, zone: 'Zone 2 · Makati and BGC' };
  }

  if (['taguig', 'pateros', 'pasig', 'mandaluyong'].includes(normalizedCity)) {
    return { fee: 60, zone: 'Zone 3 · Nearby cities' };
  }

  if (['manila', 'sanjuan', 'quezon', 'marikina'].some((cityName) => normalizedCity.includes(cityName))) {
    return { fee: 80, zone: 'Zone 4 · Central Metro Manila' };
  }

  if (['caloocan', 'malabon', 'navotas', 'valenzuela', 'laspinas', 'muntinlupa', 'paranaque'].some(
    (cityName) => normalizedCity.includes(cityName),
  )) {
    return { fee: 100, zone: 'Zone 5 · Outer Metro Manila' };
  }

  return { fee: 120, zone: 'Zone 6 · Extended delivery area' };
}

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const randomNumber = Math.floor(100 + Math.random() * 900);

  return `EV-${timestamp}-${randomNumber}`;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    cartItems,
    cartCount,
    cartSubtotal,
    clearCart,
  } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    fulfillmentMethod: 'pickup',
    address: '',
    barangay: '',
    city: '',
    province: '',
    postalCode: '',
    landmark: '',
    notes: '',
  });

  const [voucherCode, setVoucherCode] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const localDeliveryQuote = useMemo(
    () => calculateLocalDeliveryQuote(formData),
    [formData.address, formData.barangay, formData.city],
  );
  const localDeliveryFee = localDeliveryQuote.fee;
  const deliveryFee = formData.fulfillmentMethod === 'delivery' ? localDeliveryFee : 0;
  const deliveryPriceLabel = formData.city.trim() || formData.barangay.trim()
    ? `₱${localDeliveryFee.toFixed(2)}`
    : `From ₱${MINIMUM_DELIVERY_FEE.toFixed(2)}`;

  const orderTotal = useMemo(
    () => cartSubtotal + deliveryFee,
    [cartSubtotal, deliveryFee],
  );

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }));
  }

  function selectFulfillmentMethod(method) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      fulfillmentMethod: method,
      address: currentFormData.address,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      fulfillmentMethod: '',
      address: '',
    }));
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Please enter your full name.';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Please enter your mobile number.';
    } else if (
      !/^09\d{9}$/.test(
        formData.mobileNumber.replace(/\s/g, ''),
      )
    ) {
      newErrors.mobileNumber =
        'Enter a valid 11-digit Philippine mobile number.';
    }

    if (
      formData.fulfillmentMethod === 'delivery' &&
      !formData.address.trim()
    ) {
      newErrors.address = 'Please enter your delivery address.';
    }

    if (
      formData.fulfillmentMethod === 'delivery' &&
      !formData.barangay.trim()
    ) {
      newErrors.barangay = 'Please enter your barangay.';
    }

    if (
      formData.fulfillmentMethod === 'delivery' &&
      !formData.city.trim()
    ) {
      newErrors.city = 'Please enter your city or municipality.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function saveOrder(order) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const { data: savedOrder, error } = await supabase
        .from("orders")
        .insert({
          auth_user_id: user.id,
          order_number: order.orderNumber,
          status: order.status,
          total: order.total,
        })
        .select()
        .single();

      if (error) throw error;
      const orderItems = order.items.map((item) => ({
        order_id: savedOrder.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemError) throw itemError;

      // Deduct product stock
      for (const item of order.items) {

        console.log("Cart item:", item);

        const { data: product, error: fetchError } = await supabase
          .from("products")
          .select("id, stock")
          .eq("id", item.id)
          .single();

        console.log("Matched product:", product);
        console.log("Fetch error:", fetchError);

        if (fetchError) throw fetchError;

        const newStock = Math.max(0, product.stock - item.quantity);

        const { data: updatedProduct, error: updateError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.id)
          .select();

        console.log("New stock:", newStock);
        console.log("Updated product:", updatedProduct);
        console.log("Update error:", updateError);

        if (updateError) throw updateError;
      }

      localStorage.setItem(
        "evelyns-store-last-order",
        JSON.stringify(order)
      );
    } catch (error) {
      console.error("Unable to save order:", error);
    }
  }

  async function handlePlaceOrder(event) {
    event.preventDefault();

    if (!validateForm() || cartItems.length === 0) {
      return;
    }

    setIsSubmitting(true);

    const newOrder = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      status: 'Preparing',
      customer: {
        name: formData.customerName.trim(),
        mobileNumber: formData.mobileNumber
          .replace(/\s/g, '')
          .trim(),
      },
      fulfillmentMethod: formData.fulfillmentMethod,
      address:
        formData.fulfillmentMethod === 'delivery'
          ? [
            formData.address,
            formData.barangay,
            formData.city,
            formData.province,
            formData.postalCode,
            formData.landmark && `Landmark: ${formData.landmark}`,
          ]
            .filter(Boolean)
            .join(', ')
          : '',
      notes: formData.notes.trim(),
      paymentMethod:
        formData.fulfillmentMethod === 'pickup'
          ? 'Cash on Pickup'
          : 'Cash on Delivery',
      voucherCode: voucherCode.trim(),
      items: cartItems,
      itemCount: cartCount,
      subtotal: cartSubtotal,
      deliveryFee,
      total: orderTotal,
    };

    const savedOrders = (() => {
      try {
        const value = localStorage.getItem('evelyns-store-orders');
        return value ? JSON.parse(value) : [];
      } catch {
        return [];
      }
    })();

    localStorage.setItem(
      'evelyns-store-orders',
      JSON.stringify([
        newOrder,
        ...(Array.isArray(savedOrders) ? savedOrders : []).filter(
          (order) => order.id !== newOrder.id,
        ),
      ]),
    );
    localStorage.setItem('evelyns-store-last-order', JSON.stringify(newOrder));

    await saveOrder(newOrder);
    clearCart();

    navigate('/order-confirmation', {
      state: {
        order: newOrder,
      },
    });
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <SiteHeader />

        <main className="checkout-empty">
          <div className="checkout-empty-card">
            <PackageCheck
              size={54}
              strokeWidth={1.5}
              aria-hidden="true"
            />

            <h1>Your cart is empty</h1>

            <p>
              Add products to your cart before proceeding to
              checkout.
            </p>

            <Link to="/products" className="checkout-shop-link">
              Browse Products
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <SiteHeader />

      <section className="checkout-introduction">
        <div className="checkout-container">
          <div className="checkout-breadcrumb">
            <Link to="/">Home</Link>

            <ChevronRight size={15} aria-hidden="true" />

            <Link to="/cart">Cart</Link>

            <ChevronRight size={15} aria-hidden="true" />

            <span>Checkout</span>
          </div>

          <div className="checkout-title-row">
            <h1>Checkout</h1>

            <p className="checkout-page-subtitle">
              Complete your order by providing your information below.
            </p>
          </div>
        </div>
      </section>

      <main className="checkout-main">
        <div className="checkout-container checkout-layout">
          <form
            className="checkout-form"
            onSubmit={handlePlaceOrder}
            noValidate
          >
            <section className="checkout-section">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">1</span>

                <div>
                  <h2>Customer & Delivery Details</h2>
                  <p>Provide the details we need to prepare and deliver your order.</p>
                </div>
              </div>

              <div className="checkout-form-grid">
                <label className="checkout-field">
                  <span>Full name</span>

                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    onChange={handleInputChange}
                  />

                  {errors.customerName && (
                    <small>{errors.customerName}</small>
                  )}
                </label>

                <label className="checkout-field">
                  <span>Mobile number</span>

                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    placeholder="09XXXXXXXXX"
                    maxLength="11"
                    autoComplete="tel"
                    onChange={handleInputChange}
                  />

                  {errors.mobileNumber && (
                    <small>{errors.mobileNumber}</small>
                  )}
                </label>

                <label className="checkout-field checkout-address-field checkout-field--full">
                  <span>
                    <MapPin size={16} />
                    House number, street, and subdivision
                  </span>

                  <textarea
                    name="address"
                    value={formData.address}
                    placeholder="Example: 123 Mabini Street, Green Village"
                    rows="3"
                    onChange={handleInputChange}
                  />

                  {errors.address && (
                    <small>{errors.address}</small>
                  )}
                </label>

                <label className="checkout-field">
                  <span>Barangay</span>

                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    placeholder="Enter barangay"
                    onChange={handleInputChange}
                  />

                  {errors.barangay && (
                    <small>{errors.barangay}</small>
                  )}
                </label>

                <label className="checkout-field">
                  <span>City or municipality</span>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    placeholder="Enter city or municipality"
                    onChange={handleInputChange}
                  />

                  {errors.city && (
                    <small>{errors.city}</small>
                  )}
                </label>

                <label className="checkout-field">
                  <span>Province or region</span>

                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    placeholder="Enter province or region"
                    onChange={handleInputChange}
                  />
                </label>

                <label className="checkout-field">
                  <span>Postal code</span>

                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    placeholder="Optional"
                    inputMode="numeric"
                    onChange={handleInputChange}
                  />
                </label>

                <label className="checkout-field checkout-field--full">
                  <span>Nearby landmark — optional</span>

                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    placeholder="Example: Beside the barangay hall"
                    onChange={handleInputChange}
                  />
                </label>
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">2</span>

                <div>
                  <h2>Shipping Option</h2>
                  <p>Choose how you want to receive your order.</p>
                </div>
              </div>

              <div className="checkout-methods">
                <button
                  type="button"
                  className={`checkout-method-card ${formData.fulfillmentMethod === 'pickup'
                    ? 'active'
                    : ''
                    }`}
                  aria-pressed={
                    formData.fulfillmentMethod === 'pickup'
                  }
                  onClick={() =>
                    selectFulfillmentMethod('pickup')
                  }
                >
                  <span className="checkout-method-icon">
                    <Store size={23} />
                  </span>

                  <span className="checkout-method-content">
                    <strong>Store Pickup</strong>
                    <small>Pick up your order at Evelyn’s Store.</small>
                  </span>

                  <span className="checkout-method-price">Free</span>
                </button>

                <button
                  type="button"
                  className={`checkout-method-card ${formData.fulfillmentMethod === 'delivery'
                    ? 'active'
                    : ''
                    }`}
                  aria-pressed={
                    formData.fulfillmentMethod === 'delivery'
                  }
                  onClick={() =>
                    selectFulfillmentMethod('delivery')
                  }
                >
                  <span className="checkout-method-icon">
                    <Truck size={23} />
                  </span>

                  <span className="checkout-method-content">
                    <strong>Local Delivery</strong>
                    <small>{localDeliveryQuote.zone}. Fee is based on your delivery area.</small>
                  </span>

                  <span className="checkout-method-price">{deliveryPriceLabel}</span>
                </button>
              </div>

            </section>

            <section className="checkout-section">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">3</span>

                <div>
                  <h2>Payment Method</h2>
                  <p>Choose how you will pay for your order.</p>
                </div>
              </div>

              <div className="checkout-payment-method">
                <Banknote size={24} aria-hidden="true" />
                <div>
                  <strong>
                    {formData.fulfillmentMethod === 'pickup'
                      ? 'Cash on Pickup'
                      : 'Cash on Delivery'}
                  </strong>
                  <span>
                    {formData.fulfillmentMethod === 'pickup'
                      ? 'Pay at Evelyn\'s Store when collecting your items.'
                      : 'Pay the rider when your order arrives.'}
                  </span>
                </div>
              </div>

              <div className="checkout-payment-details">
                <CircleAlert size={17} aria-hidden="true" />
                <div>
                  <strong>Payment details</strong>
                  <p>
                    Please prepare the exact amount when possible. Your final
                    payment total is shown in the order summary.
                  </p>
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-heading">
                <span className="checkout-section-number">4</span>

                <div>
                  <h2>Additional Notes</h2>
                  <p>
                    Add special instructions for the store.
                  </p>
                </div>
              </div>

              <label className="checkout-field">
                <span>Order notes — optional</span>

                <textarea
                  name="notes"
                  value={formData.notes}
                  placeholder="Example: Please prepare exact change."
                  rows="4"
                  maxLength="250"
                  onChange={handleInputChange}
                />

                <div className="checkout-character-count">
                  {formData.notes.length}/250
                </div>
              </label>
            </section>

            <div className="checkout-form-submit">
              <button
                type="submit"
              className="checkout-place-order-button"
              disabled={isSubmitting}
            >
                {isSubmitting
                  ? 'PLACING ORDER...'
                  : 'PLACE ORDER'}
              </button>

              <p>Review your information before placing the order.</p>
            </div>
          </form>

          <aside className="checkout-summary">
            <div className="checkout-summary-card">
              <h2><ClipboardCheck size={20} aria-hidden="true" />Order Summary</h2>

              <div className="checkout-summary-items">
                {cartItems.map((item) => (
                  <div
                    className="checkout-summary-item"
                    key={item.id}
                  >
                    <div className="checkout-summary-product">
                      <div className="checkout-summary-item-image">
                        {item.image ? (
                          <img src={item.image} alt="" />
                        ) : (
                          <PackageCheck size={18} />
                        )}
                      </div>

                      <div className="checkout-summary-item-info">
                        <strong>{item.name}</strong>
                        <span>
                          ₱{item.price.toFixed(2)} · Qty {item.quantity}
                        </span>
                      </div>
                    </div>

                    <span className="checkout-summary-item-price">
                      ₱
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <label className="checkout-voucher-field">
                <span>Discount voucher</span>
                <div className="checkout-voucher-input-row">
                  <input
                    type="text"
                    value={voucherCode}
                    placeholder="Enter voucher code"
                    onChange={(event) => setVoucherCode(event.target.value)}
                  />
                  <button type="button">Apply</button>
                </div>
              </label>

              <div className="checkout-summary-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>₱{cartSubtotal.toFixed(2)}</strong>
                </div>

                <div>
                  <span>Delivery fee</span>
                  <strong>
                    {deliveryFee === 0
                      ? 'Free'
                      : `₱${deliveryFee.toFixed(2)}`}
                  </strong>
                </div>

                <div className="checkout-summary-total">
                  <span>Total</span>
                  <strong>₱{orderTotal.toFixed(2)}</strong>
                </div>
              </div>

            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CheckoutPage;
