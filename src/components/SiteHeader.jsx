import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  Check,
  LogOut,
  Menu,
  Megaphone,
  PackageCheck,
  Search,
  ShoppingCart,
  UserRound,
} from 'lucide-react';

import SideMenu from './SideMenu.jsx';
import { useCart } from '../context/CartContext.jsx';
import storeLogo from '../assets/store-logo.png';
import './SiteHeader.css';
import RegisterPage from '../pages/RegisterPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import { useAuth } from "../context/AuthContext";
import { useSearch } from '../context/SearchContext';
import { supabase } from '../lib/supabase';

const READ_NOTIFICATIONS_KEY =
  'evelyns-store-read-notifications';

function getReadNotificationIds() {
  try {
    const savedIds = localStorage.getItem(
      READ_NOTIFICATIONS_KEY,
    );

    const parsedIds = savedIds
      ? JSON.parse(savedIds)
      : [];

    return Array.isArray(parsedIds)
      ? parsedIds
      : [];
  } catch {
    return [];
  }
}

function formatNotificationDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}



function SiteHeader() {
  const { profile, user, loading, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [accountMenuOpen, setAccountMenuOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const accountMenuRef = useRef(null);

  const [notificationOrders, setNotificationOrders] =
    useState([]);

  const [readNotificationIds, setReadNotificationIds] =
    useState(() => getReadNotificationIds());

  const notificationRef = useRef(null);

  async function loadNotificationOrders() {
    if (!user?.id) {
      setNotificationOrders([]);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at')
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Unable to load notifications:', error);
      return;
    }

    setNotificationOrders(
      (data || []).map((order) => ({
        id: order.id,
        orderNumber:
          order.order_number || `ORDER-${order.id}`,
        status: order.status || 'Preparing',
        createdAt: order.created_at,
      })),
    );
  }

  const notifications = useMemo(() => {
    return [...notificationOrders]
      .sort((firstOrder, secondOrder) => {
        const firstDate =
          new Date(firstOrder.createdAt).getTime() || 0;

        const secondDate =
          new Date(secondOrder.createdAt).getTime() || 0;

        return secondDate - firstDate;
      })
      .map((order, index) => {
        const status = String(
          order.status || 'Pending',
        ).trim();

        const orderIdentifier =
          order.id ||
          order.orderNumber ||
          `order-${index}`;

        return {
          id: `${orderIdentifier}-${status}`,
          orderNumber:
            order.orderNumber || `Order ${index + 1}`,
          status,
          createdAt: order.updatedAt || order.createdAt,
        };
      })
      .slice(0, 8);
  }, [notificationOrders]);

  const unreadCount = notifications.filter(
    (notification) =>
      !readNotificationIds.includes(notification.id),
  ).length;

  function saveReadNotificationIds(updatedIds) {
    setReadNotificationIds(updatedIds);

    localStorage.setItem(
      READ_NOTIFICATIONS_KEY,
      JSON.stringify(updatedIds),
    );
  }

  function handleNotificationToggle() {
    setNotificationsOpen((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue) {
        loadNotificationOrders();
      }

      return nextValue;
    });
  }

  function markNotificationAsRead(notificationId) {
    if (readNotificationIds.includes(notificationId)) {
      return;
    }

    saveReadNotificationIds([
      ...readNotificationIds,
      notificationId,
    ]);
  }

  function markAllNotificationsAsRead() {
    saveReadNotificationIds(
      notifications.map(
        (notification) => notification.id,
      ),
    );
  }

  useEffect(() => {
    function handleOutsideClick(event) {

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    loadNotificationOrders();
  }, [user?.id]);

  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  function handleSearchClick() {
    setSearchOpen(true);
  }

  return (
    <>
      <header className="site-store-hours">
        <Megaphone size={16} strokeWidth={2} aria-hidden="true" />
        <span>Store Hours: 5:00 AM to 9:30 PM</span>
      </header>

      <nav className="site-navbar" aria-label="Main navigation">

        {searchOpen ? (
          <div className="site-navbar-search">
            <Search size={22} />

            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate('/products');
                  setSearchOpen(false);
                }
              }}
              autoFocus
            />

            <button
              className="site-search-close"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="site-navbar-container">

            <div className="site-nav-left">
              <button
                type="button"
                className="site-icon-button"
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu size={23} strokeWidth={2} />
              </button>

              <button
                type="button"
                className="site-icon-button"
                aria-label="Search products"
                onClick={handleSearchClick}
              >
                <Search size={22} strokeWidth={2} />
              </button>
            </div>

            <Link
              to="/"
              className="site-logo"
              aria-label="Evelyn's Store home"
            >
              <img
                src={storeLogo}
                alt="Evelyn's Store"
                className="site-logo-image"
              />
            </Link>

            <div className="site-nav-right">
              <div
                className="site-notification"
                ref={notificationRef}
              >
                <button
                  type="button"
                  className="site-icon-button site-notification-button"
                  aria-label="Open notifications"
                  aria-expanded={notificationsOpen}
                  onClick={handleNotificationToggle}
                >
                  <div className="site-bell-wrapper">

                    <Bell size={22} strokeWidth={2} />

                    {unreadCount > 0 && (
                      <span className="site-notification-count">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}

                  </div>
                </button>

                {notificationsOpen && (
                  <div className="site-notification-dropdown">
                    <div className="site-notification-header">
                      <div>
                        <strong>Notifications</strong>

                        <span>
                          {unreadCount === 0
                            ? 'You are all caught up'
                            : `${unreadCount} unread`}
                        </span>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                        >
                          <Check size={15} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="site-notification-empty">
                        <div>
                          <Bell size={25} strokeWidth={1.6} />
                        </div>

                        <strong>No notifications yet</strong>

                        <span>
                          Order updates will appear here.
                        </span>
                      </div>
                    ) : (
                      <div className="site-notification-list">
                        {notifications.map((notification) => {
                          const isUnread =
                            !readNotificationIds.includes(
                              notification.id,
                            );

                          return (
                            <Link
                              to="/orders"
                              className={`site-notification-item ${isUnread ? 'unread' : ''
                                }`}
                              key={notification.id}
                              onClick={() => {
                                markNotificationAsRead(
                                  notification.id,
                                );

                                setNotificationsOpen(false);
                              }}
                            >
                              <div className="site-notification-item-icon">
                                <PackageCheck size={19} />
                              </div>

                              <div className="site-notification-item-content">
                                <div>
                                  <strong>
                                    {notification.status ===
                                      'Pending'
                                      ? 'Order successfully placed'
                                      : 'Order status updated'}
                                  </strong>

                                  {isUnread && (
                                    <span className="site-notification-unread-dot" />
                                  )}
                                </div>

                                <p>
                                  {notification.orderNumber} is now{' '}
                                  <b>{notification.status}</b>.
                                </p>

                                <small>
                                  {formatNotificationDate(
                                    notification.createdAt,
                                  )}
                                </small>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {notifications.length > 0 && (
                      <Link
                        to="/orders"
                        className="site-notification-view-all"
                        onClick={() =>
                          setNotificationsOpen(false)
                        }
                      >
                        View My Orders
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {user ? (
                <div
                  className="site-account-menu"
                  ref={accountMenuRef}
                >
                  <button
                    type="button"
                    className="site-icon-button site-login-icon"
                    aria-label="Account"
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  >
                    <UserRound size={22} strokeWidth={2} />
                  </button>

                  {accountMenuOpen && (
                    <div className="site-account-dropdown">

                      <button
                        type="button"
                        className="logout"
                        onClick={logout}
                      >
                        <LogOut size={18} />
                        Logout
                      </button>

                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="site-icon-button site-login-icon"
                  aria-label="Login"
                  onClick={() => setShowLogin(true)}
                >
                  <UserRound size={22} strokeWidth={2} />
                </button>
              )}
              <Link
                to="/cart"
                className="site-icon-button site-cart-icon"
                aria-label="Open cart"
              >
                <ShoppingCart size={22} strokeWidth={2} />

                {cartCount > 0 && (
                  <span className="site-cart-count">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}
      </nav>

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        cartCount={cartCount}
      />

      {showLogin && (
        <LoginPage
          onClose={() => setShowLogin(false)}
          openRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterPage
          onClose={() => setShowRegister(false)}
          openLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
}

export default SiteHeader;
