import { Check, X } from 'lucide-react';
import './CartToast.css';

function CartToast({
  productName,
  quantity = 1,
  onClose,
}) {
  return (
    <div className="cart-toast" role="status">
      <div className="cart-toast-icon">
        <Check size={18} strokeWidth={2.5} />
      </div>

      <div className="cart-toast-content">
        <p className="cart-toast-title">Added to cart</p>

        <p className="cart-toast-product">
          {quantity > 1 && `${quantity}× `}
          {productName}
        </p>
      </div>

      <button
        type="button"
        className="cart-toast-close"
        aria-label="Close notification"
        onClick={onClose}
      >
        <X size={17} />
      </button>
    </div>
  );
}

export default CartToast;