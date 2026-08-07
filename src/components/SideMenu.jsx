import { Link } from 'react-router';
import {
  ChevronRight,
  Clock3,
  ClipboardList,
  Home,
  LayoutDashboard,
  Package,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react';
import storeLogoV2 from '../assets/store-logo-v2.png';

import './SideMenu.css';

function SideMenu({ isOpen, onClose, cartCount = 0 }) {
  const menuGroups = [
    {
      title: 'Storefront',
      items: [
        { label: 'Home', to: '/', icon: Home },
        { label: 'Products', to: '/products', icon: Package },
      ],
    },
    {
      title: 'Shopping',
      items: [
        { label: 'Cart', to: '/cart', count: cartCount, icon: ShoppingCart },
        { label: 'Orders', to: '/orders', icon: ClipboardList },
      ],
    },
    {
      title: 'Management',
      items: [{ label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard }],
    },
  ];

  return (
    <>
      <button
        type="button"
        className={`side-menu-overlay ${isOpen ? 'open' : ''}`}
        aria-label="Close menu"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />

      <aside
        className={`shared-side-menu ${isOpen ? 'open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="shared-menu-header">
          <img src={storeLogoV2} alt="Evelyn's Store" className="shared-menu-logo" />

          <button
            type="button"
            className="shared-menu-close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <nav className="shared-menu-navigation" aria-label="Side navigation">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="shared-menu-group-title">{group.title}</p>
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="shared-menu-item"
                  onClick={onClose}
                >
                  <span className="shared-menu-item-content">
                    <item.icon size={18} aria-hidden="true" />
                    {item.label}
                  </span>
                  {item.count > 0 ? (
                    <span className="shared-menu-cart-count">{item.count > 9 ? '9+' : item.count}</span>
                  ) : (
                    <ChevronRight size={16} aria-hidden="true" />
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="shared-menu-footer">
          <Link to="/login" className="shared-menu-login" onClick={onClose}>
            <UserRound size={18} />
            LOGIN
          </Link>
          <div className="shared-menu-hours">
            <Clock3 size={15} />
            Store hours: 5:00 AM to 9:30 PM
          </div>
        </div>
      </aside>
    </>
  );
}

export default SideMenu;
