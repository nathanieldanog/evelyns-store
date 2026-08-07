import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext.jsx';
import SiteHeader from '../components/SiteHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useProducts } from '../context/ProductContext.jsx';
import { useSearch } from '../context/SearchContext';
import { PRODUCT_CATEGORIES } from '../data/categories.js';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
} from 'lucide-react';

import './ProductsPage.css';


function ProductsPage() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [sortOption, setSortOption] = useState('featured');
  const { addToCart, cartItems } = useCart();
  const { products } = useProducts();
  const [productQuantities, setProductQuantities] = useState({});
  const [showAvailability, setShowAvailability] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [activeFilters, setActiveFilters] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const searchInputRef = useRef(null);

  const categories = useMemo(() => {
    return ['All', ...PRODUCT_CATEGORIES];
  }, [products]);

  const cheapestPrice = Math.min(...products.map(product => product.price));
  const mostExpensivePrice = Math.max(...products.map(product => product.price));

  const displayedProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredProducts = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);

      const selectedCategories = activeFilters.filter(
        filter => filter !== "In Stock" && filter !== "Out of Stock"
      );

      const matchesSidebarCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const matchesAvailability =
        (
          !activeFilters.includes("In Stock") ||
          product.stock > 0
        ) &&
        (
          !activeFilters.includes("Out of Stock") ||
          product.stock === 0
        );

      const matchesPrice =
        (minPrice === '' || product.price >= Number(minPrice)) &&
        (maxPrice === '' || product.price <= Number(maxPrice));

      return (
        matchesSearch &&
        matchesSidebarCategory &&
        matchesAvailability &&
        matchesPrice
      );
    });

    return [...filteredProducts].sort((firstProduct, secondProduct) => {
      if (sortOption === 'price-low') {
        return firstProduct.price - secondProduct.price;
      }

      if (sortOption === 'price-high') {
        return secondProduct.price - firstProduct.price;
      }

      if (sortOption === 'name') {
        return firstProduct.name.localeCompare(secondProduct.name);
      }

      return 0;
    });
  }, [
    products,
    searchQuery,
    sortOption,
    activeFilters,
    minPrice,
    maxPrice,
  ]);

  function getProductQuantity(productId) {
    return productQuantities[productId] ?? 1;
  }

  function changeProductQuantity(product, amount) {
    setProductQuantities((currentQuantities) => {
      const currentQuantity = currentQuantities[product.id] || 1;

      const newQuantity = Math.min(
        product.stock,
        Math.max(1, currentQuantity + amount)
      );

      return {
        ...currentQuantities,
        [product.id]: newQuantity,
      };
    });
  }

  function handleQuantityInput(product, value) {
    if (value === '') {
      setProductQuantities((currentQuantities) => ({
        ...currentQuantities,
        [product.id]: '',
      }));

      return;
    }

    const typedQuantity = Math.floor(Number(value));

    if (!Number.isFinite(typedQuantity)) {
      return;
    }

    const safeQuantity = Math.min(
      product.stock,
      Math.max(1, typedQuantity),
    );

    setProductQuantities((currentQuantities) => ({
      ...currentQuantities,
      [product.id]: safeQuantity,
    }));
  }

  function handleQuantityBlur(product) {
    const currentQuantity = Number(
      productQuantities[product.id],
    );

    if (!currentQuantity || currentQuantity < 1) {
      setProductQuantities((currentQuantities) => ({
        ...currentQuantities,
        [product.id]: 1,
      }));
    }
  }

  function toggleFilter(filterName, checked) {
    if (checked) {
      setActiveFilters((currentFilters) => [
        ...currentFilters,
        filterName,
      ]);
    } else {
      setActiveFilters((currentFilters) =>
        currentFilters.filter(
          (filter) => filter !== filterName
        )
      );
    }
  }

  function handleAddProductToCart(product) {
    const quantity =
      Number(getProductQuantity(product.id)) || 1;

    const existingItem = cartItems.find(
      (item) => item.id === product.id
    );

    const alreadyInCart = existingItem
      ? existingItem.quantity
      : 0;

    if (alreadyInCart + quantity > product.stock) {
      alert(`Only ${product.stock} ${product.name} left in stock.`);
      return;
    }

    addToCart(product, quantity);

    setProductQuantities((currentQuantities) => ({
      ...currentQuantities,
      [product.id]: 1,
    }));
  }

  return (
    <div className="products-page">
      {/* Store hours */}
      <SiteHeader />

      {/* Page introduction */}
      <section className="products-introduction">
        <div className="products-container">
          <div className="products-breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={15} />
            <span>Products</span>
          </div>

          <div className="products-title-row">
            <h1 className="products-page-title">Products</h1>

            <p className="products-page-subtitle">
              Browse quality products for your daily needs at affordable prices.
            </p>
          </div>
        </div>
      </section>

      <main className="products-main">
        <div className="products-container">
          <div className="products-layout">

            <aside className="products-sidebar">

              <div className="products-filter-header">

                <h2 className="products-filter-title"></h2>
              </div>

              <div className="products-filter-group">

                <h3
                  onClick={() => setShowAvailability(!showAvailability)}
                >
                  <span>Availability</span>

                  {showAvailability ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </h3>
                {showAvailability && (
                  <>
                    <label className="products-checkbox">
                      <input
                        type="checkbox"
                        checked={activeFilters.includes("In Stock")}
                        onChange={(event) =>
                          toggleFilter(
                            "In Stock",
                            event.target.checked
                          )
                        }
                      />

                      <span>In Stock</span>
                    </label>

                    <label className="products-checkbox">
                      <input
                        type="checkbox"
                        checked={activeFilters.includes("Out of Stock")}
                        onChange={(event) =>
                          toggleFilter(
                            "Out of Stock",
                            event.target.checked
                          )
                        }
                      />

                      <span>Out of Stock</span>
                    </label>
                  </>
                )}
              </div>

              <div className="products-filter-group">

                <h3
                  onClick={() => setShowPrice(!showPrice)}
                >
                  <span>Price</span>

                  {showPrice ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </h3>

                {showPrice && (
                  <div className="products-price-filter">

                    <div className="products-price-filter">
                      <div className="products-price-field">
                        <label>From</label>

                        <div className="products-price-input">
                          <span className="products-peso-sign">₱</span>

                          <input
                            type="number"
                            placeholder="0"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="products-price-field">
                        <label>To</label>

                        <div className="products-price-input">
                          <span className="products-peso-sign">₱</span>

                          <input
                            type="number"
                            placeholder="2500.00"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              <div className="products-filter-group">

                <h3
                  onClick={() => setShowCategory(!showCategory)}
                >
                  <span>Category</span>

                  {showCategory ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </h3>

                {showCategory && (
                  <>
                    {categories
                      .filter(category => category !== "All")
                      .map(category => {

                        const productCount = products.filter(
                          product => product.category === category
                        ).length;

                        return (

                          <label
                            className="products-checkbox"
                            key={category}
                          >

                            <input
                              type="checkbox"
                              checked={activeFilters.includes(category)}
                              onChange={(event) =>
                                toggleFilter(
                                  category,
                                  event.target.checked
                                )
                              }
                            />
                            <span>
                              {category} ({productCount})
                            </span>

                          </label>

                        );

                      })}
                  </>
                )}

              </div>

            </aside>

            <div className="products-content">

              {/* Search and sorting */}
              <div className="products-toolbar">

                <div className="products-toolbar-left">

                  {(activeFilters.length > 0 || minPrice !== '' || maxPrice !== '') && (
                    <div className="products-active-filters">

                      {activeFilters.map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          className="products-filter-chip"
                          onClick={() =>
                            setActiveFilters(
                              activeFilters.filter(item => item !== filter)
                            )
                          }
                        >
                          {filter}
                          <span>✕</span>
                        </button>
                      ))}

                      {(minPrice !== '' || maxPrice !== '') && (
                        <button
                          type="button"
                          className="products-filter-chip"
                          onClick={() => {
                            setMinPrice('');
                            setMaxPrice('');
                          }}
                        >
                          {(minPrice || cheapestPrice) === (maxPrice || mostExpensivePrice)
                            ? `₱${minPrice || cheapestPrice}`
                            : `₱${minPrice || cheapestPrice} - ₱${maxPrice || mostExpensivePrice}`
                          }
                          <span>✕</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="products-clear-all-button"
                        onClick={() => {
                          setActiveFilters([]);
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                      >
                        Clear All
                      </button>

                    </div>
                  )}

                </div>

                <label className="products-sort-field">
                  <span className="products-sort-label">Sort:</span>

                  <select
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price, low to high</option>
                    <option value="price-high">Price, high to low</option>
                    <option value="name">Name, A to Z</option>
                  </select>
                </label>

              </div>

              {/* Product grid */}
              {displayedProducts.length > 0 ? (
                <div className="products-grid-page">
                  {displayedProducts.map((product) => {

                    return (
                      <article className="products-card" key={product.id}>
                        <div className="products-card-image">
                          {product.badge && (
                            <span className="products-card-badge">
                              {product.badge}
                            </span>
                          )}

                          <div className="products-card-product-visual">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="products-card-product-image"
                              />
                            ) : (
                              <Package
                                size={58}
                                strokeWidth={1.3}
                                aria-label="No product image"
                              />
                            )}
                          </div>
                        </div>

                        <div className="products-card-content">
                          <p className="products-card-category">
                            {product.category}
                          </p>

                          <h3>{product.name}</h3>

                          <p className="products-card-stock">
                            {product.stock === 0
                              ? "Out of Stock"
                              : product.stock <= 5
                                ? `Only ${product.stock} left`
                                : `${product.stock} items available`}
                          </p>

                          <div className="products-price-row">
                            <span className="products-current-price">
                              ₱{product.price.toFixed(2)}
                            </span>

                            {product.oldPrice && (
                              <span className="products-old-price">
                                ₱{product.oldPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="product-purchase-controls">
                            <div
                              className="product-quantity-selector"
                              aria-label={`Quantity for ${product.name}`}
                            >
                              <button
                                type="button"
                                className="product-quantity-button"
                                aria-label={`Decrease ${product.name} quantity`}
                                onClick={() => changeProductQuantity(product, -1)}
                                disabled={getProductQuantity(product.id) === 1}
                              >
                                <Minus size={16} strokeWidth={2.2} />
                              </button>

                              <input
                                type="number"
                                className="product-quantity-input"
                                min="1"
                                max={product.stock}
                                value={getProductQuantity(product.id)}
                                aria-label={`${product.name} quantity`}
                                onChange={(event) =>
                                  handleQuantityInput(product, event.target.value)
                                }
                                onBlur={() => handleQuantityBlur(product)}
                                onKeyDown={(event) => {
                                  if (
                                    ['e', 'E', '+', '-', '.'].includes(event.key)
                                  ) {
                                    event.preventDefault();
                                  }
                                }}
                              />

                              <button
                                type="button"
                                className="product-quantity-button"
                                aria-label={`Increase ${product.name} quantity`}
                                onClick={() => changeProductQuantity(product, 1)}
                                disabled={
                                  getProductQuantity(product.id) >= product.stock
                                }
                              >
                                <Plus size={16} strokeWidth={2.2} />
                              </button>
                            </div>

                            <button
                              type="button"
                              className="products-add-button"
                              disabled={product.stock === 0}
                              onClick={() => handleAddProductToCart(product)}
                            >
                              <ShoppingCart size={17} strokeWidth={2} />

                              <span>
                                {product.stock === 0
                                  ? 'Out of Stock'
                                  : 'Add to Cart'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="products-empty-state">
                  <div className="products-empty-icon">
                    <Search
                      size={42}
                      strokeWidth={1.6}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="products-empty-label">
                    Search Results
                  </p>

                  <h2>Nothing found</h2>

                  <p className="products-empty-description">
                    Try another search term or select a different category.
                  </p>
                </div>
              )}
            </div> {/* products-content */}
          </div>   {/* products-layout */}
        </div>     {/* products-container */}
      </main>

      <Footer />

    </div>
  );
}

export default ProductsPage;
