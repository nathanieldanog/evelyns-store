import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import CartToast from '../components/CartToast.jsx';

const CartContext = createContext(null);

function createCartId(productName) {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function convertPriceToNumber(price) {
  if (typeof price === 'number') {
    return price;
  }

  return Number(String(price).replace(/[^\d.]/g, '')) || 0;
}

export function CartProvider({ children }) {

  const [cartToasts, setCartToasts] = useState([]);
  const toastTimeoutsRef = useRef(new Map());
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('evelyns-store-cart');

      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      'evelyns-store-cart',
      JSON.stringify(cartItems),
    );
  }, [cartItems]);

  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeout) => {
        window.clearTimeout(timeout);
      });

      toastTimeoutsRef.current.clear();
    };
  }, []);

  function removeCartToast(toastId) {
    setCartToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId)
    );

    const timeout = toastTimeoutsRef.current.get(toastId);

    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutsRef.current.delete(toastId);
    }
  }

  function showCartToast(productName, quantity = 1) {
    const toastId = `${Date.now()}-${Math.random()}`;

    const newToast = {
      id: toastId,
      productName,
      quantity,
    };

    setCartToasts((currentToasts) =>
      [newToast, ...currentToasts].slice(0, 5)
    );

    const timeout = window.setTimeout(() => {
      setCartToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== toastId)
      );

      toastTimeoutsRef.current.delete(toastId);
    }, 3000);

    toastTimeoutsRef.current.set(toastId, timeout);
  }

  function addToCart(product, quantity = 1) {
    const quantityToAdd = Math.max(1, Number(quantity) || 1);

    const cartProduct = {
      id: product.id,
      name: product.name,
      price:
        typeof product.price === 'string'
          ? Number(product.price.replace(/[₱,]/g, ''))
          : Number(product.price),
      image: product.image,
    };

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === cartProduct.id
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === cartProduct.id
            ? {
              ...item,
              quantity: item.quantity + quantityToAdd,
            }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...cartProduct,
          quantity: quantityToAdd,
        },
      ];
    });

    showCartToast(cartProduct.name, quantityToAdd);
  }

  function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  }

  function removeFromCart(productId) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  const cartCount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
    [cartItems],
  );

  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
    [cartItems],
  );

  const cartValue = {
    cartItems,
    cartCount,
    cartSubtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={cartValue}>
      {children}

      <div
        className="cart-toast-stack"
        aria-live="polite"
        aria-relevant="additions"
      >
        {cartToasts.map((toast) => (
          <CartToast
            key={toast.id}
            productName={toast.productName}
            quantity={toast.quantity}
            onClose={() => removeCartToast(toast.id)}
          />
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);

  if (!cart) {
    throw new Error('useCart must be used inside CartProvider.');
  }

  return cart;
}