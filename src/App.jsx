import './App.css';
import SideMenu from './components/SideMenu.jsx';
import { useState } from 'react';
import storeLogo from './assets/store-logo.png';
import storeLogoV2 from './assets/store-logo-v2.png';
import { Link } from 'react-router';
import SiteHeader from './components/SiteHeader.jsx';
import Footer from './components/Footer.jsx';
import { useProducts } from './context/ProductContext.jsx';
import {
  ArrowUp,
  Menu,
  ChevronDown,
  Search,
  Bell,
  UserRound,
  ShoppingCart,
  Megaphone,
  Star,
  Sparkles,
  Package,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock3,
  Truck,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
} from "react-icons/fa6";

const FAQs = [
  {
    question: "What are your store hours?",
    answer: "We are open daily from 5:00 AM to 9:30 PM.",
  },
  {
    question: "Do you offer delivery?",
    answer: "Yes. Delivery is available within nearby areas depending on your location.",
  },
  {
    question: "Can I reserve products before pickup?",
    answer: "Yes. You may place an order online and choose Pickup during checkout.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We currently accept Cash on Delivery (COD) and Cash for Pickup orders.",
  },
];

function App() {
  const [openFAQ, setOpenFAQ] = useState(0);
  const { products } = useProducts();

  const [featuredTab, setFeaturedTab] = useState('best-sellers');

  const bestSellerProducts = products.filter((product) => {
    const badge = String(product.badge || '').toLowerCase();

    return badge === 'best seller' || badge === 'popular';
  });

  const newArrivalProducts = products.filter((product) => {
    const badge = String(product.badge || '').toLowerCase();

    return badge === 'new';
  });

  const displayedProducts =
    featuredTab === 'best-sellers'
      ? (
        bestSellerProducts.length > 0
          ? bestSellerProducts
          : products
      ).slice(0, 8)
      : (
        newArrivalProducts.length > 0
          ? newArrivalProducts
          : products
      ).slice(0, 8);

  return (
    <div className="app">
      {/* Store hours header */}
      <SiteHeader />

      {/* Blank home page content */}
      <main className="home-page">
        <section className="hero-section">
          <div className="hero-overlay"></div>

          <div className="hero-content">

            <h1 className="hero-title">
              <span>
                <span className="hero-online">Online</span> Sari-Sari Store
              </span>
            </h1>

            <p className="hero-description">
              Shop for groceries, snacks, beverages, and everyday essentials anytime,
              anywhere. Enjoy a fast, convenient, and hassle-free online shopping
              experience with reliable delivery right to your doorstep.
            </p>

            <div className="hero-buttons">
              <a href="/register" className="hero-button hero-button-primary">
                <UserRound size={18} strokeWidth={2} />
                Create Account
              </a>

              <a href="/products" className="hero-button hero-button-secondary">
                <ShoppingCart size={18} strokeWidth={2} />
                Shop Products
              </a>
            </div>

            <div className="hero-features">
              <div className="hero-feature">
                <ShoppingCart size={30} />
                <span>
                  Quick and Easy
                  <br />
                  Ordering
                </span>
              </div>

              <div className="hero-feature">
                <Truck size={30} />
                <span>
                  Fast Local
                  <br />
                  Delivery
                </span>
              </div>

              <div className="hero-feature">
                <Package size={30} />
                <span>
                  Wide Product
                  <br />
                  Selection
                </span>
              </div>

              <div className="hero-feature">
                <ShieldCheck size={30} />
                <span>
                  Safe and Secure
                  <br />
                  Shopping
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="featured-section" id="featured-products">
          <div className="featured-heading">

            <p className="section-label">
              EVERYDAY ESSENTIALS
            </p>

            <h2>Featured Products</h2>

            <p className="featured-subtitle">
              Discover our best-selling and newest products, carefully selected to provide quality, affordability, and convenience for your everyday needs.
            </p>

            <div className="featured-tabs" role="tablist">
              <button
                type="button"
                className={`featured-tab ${featuredTab === 'best-sellers' ? 'active' : ''}`}
                onClick={() => setFeaturedTab('best-sellers')}
              >
                <Star size={16} />
                Best Sellers
              </button>

              <button
                type="button"
                className={`featured-tab ${featuredTab === 'new-arrivals' ? 'active' : ''}`}
                onClick={() => setFeaturedTab('new-arrivals')}
              >
                <ShoppingBag size={16} />
                New Arrivals
              </button>
            </div>
          </div>

          <div className="products-grid">
            {displayedProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-area">
                  {product.badge && (
                    <span className="discount-badge">
                      {product.badge}
                    </span>
                  )}

                  <div className="home-product-visual">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                      />
                    ) : (
                      <Package
                        size={55}
                        strokeWidth={1.3}
                        aria-label="No product image"
                      />
                    )}
                  </div>
                </div>

                <div className="product-information">
                  <p className="product-category">
                    {product.category}
                  </p>

                  <h3>{product.name}</h3>

                  <p
                    className={`home-product-stock ${product.stock === 0 ? 'out-of-stock' : ''
                      }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} available`
                      : 'Out of stock'}
                  </p>

                  <div className="product-price-row">
                    <span className="product-price">
                      ₱{Number(product.price).toFixed(2)}
                    </span>

                    {product.oldPrice !== null &&
                      Number(product.oldPrice) >
                      Number(product.price) && (
                        <span className="old-product-price">
                          ₱{Number(product.oldPrice).toFixed(2)}
                        </span>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Link
            to="/products"
            className="view-products-button"
          >
            View All Products
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
        </section>

        <Footer />
      </main>
    </div>
  );
}

export default App;