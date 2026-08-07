import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import { Link } from 'react-router';

import {
    AlertTriangle,
    Boxes,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    ExternalLink,
    Eye,
    LayoutDashboard,
    Package,
    Pencil,
    PhilippinePeso,
    Plus,
    RotateCcw,
    Search,
    ShoppingBag,
    Users,
    Wallet,
    Trash2,
} from 'lucide-react';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

import SiteHeader from '../components/SiteHeader.jsx';
import Footer from '../components/Footer.jsx';
import { useProducts } from '../context/ProductContext.jsx';
import { supabase } from "../lib/supabase";
import { PRODUCT_CATEGORIES } from '../data/categories.js';

import './AdminPage.css';

const EMPTY_PRODUCT_FORM = {
    name: '',
    category: 'Snacks',
    price: '',
    oldPrice: '',
    stock: '',
    image: '',
    badge: '',
};

const ORDER_STATUSES = [
    'Preparing',
    'Ready for Pickup',
    'Out for Delivery',
    'Completed',
    'Cancelled',
];

const CATEGORY_COLORS = [
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
];

const CREDIT_STORAGE_KEY = "evelyn-store-credit";

function loadCredits() {
    try {
        const saved = localStorage.getItem(CREDIT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveCredits(data) {
    localStorage.setItem(
        CREDIT_STORAGE_KEY,
        JSON.stringify(data)
    );
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(value) || 0);
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(price) || 0);
}

function formatDate(date) {
    if (!date) {
        return 'Unknown date';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

function formatShortDate(date) {
    if (!date) return 'Unknown date';

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date));
}

function getOrderKey(order) {
    return order.id || order.orderNumber;
}

function getOrderItemCount(order) {
    if (Number(order.itemCount) > 0) {
        return Number(order.itemCount);
    }

    return (order.items || []).reduce(
        (total, item) =>
            total + (Number(item.quantity) || 0),
        0,
    );
}

function getStatusClass(status) {
    return String(status || 'Preparing')
        .toLowerCase()
        .replace(/\s+/g, '-');
}

function AdminPage() {
    const {
        products,
        loadProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        resetProducts,
    } = useProducts();
    const [activeSection, setActiveSection] =
        useState('overview');

    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [categorySalesData, setCategorySalesData] = useState([]);

    const [analytics, setAnalytics] = useState({
        todaySales: 0,
        monthSales: 0,
        totalRevenue: 0,
        totalOrders: 0,
        bestSellingProducts: [],
    });

    const [monthlySalesData, setMonthlySalesData] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');

    const [editingProductId, setEditingProductId] =
        useState(null);

    const [productForm, setProductForm] = useState(
        EMPTY_PRODUCT_FORM,
    );

    const [formError, setFormError] = useState('');

    const [creditCustomers, setCreditCustomers] =
        useState(loadCredits);

    const [customerName, setCustomerName] =
        useState("");

    const [creditAmounts, setCreditAmounts] =
        useState({});

    const [creditSearch, setCreditSearch] =
        useState("");

    const [expandedCustomer, setExpandedCustomer] =
        useState(null);

    useEffect(() => {
        async function loadOrders() {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                *,
                accounts!orders_auth_user_id_fkey (
                    username,
                    email
                ),
                order_items (*)
            `)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to load orders:", error);
                return;
            }

            const formattedOrders = (data || []).map((order) => ({
                id: order.id,
                orderNumber: `ORDER-${String(order.id).padStart(6, "0")}`,
                createdAt: order.created_at,
                status: order.status,
                fulfillmentMethod: order.fulfillment_method,
                total: order.total,

                customer: {
                    name: order.accounts?.username || "Unknown User",
                    email: order.accounts?.email || "",
                },

                items: order.order_items || [],
                itemCount: (order.order_items || []).reduce(
                    (total, item) => total + Number(item.quantity || 0),
                    0
                ),
            }));

            setOrders(formattedOrders);

            const customerMap = {};

            formattedOrders.forEach((order) => {
                const email = order.customer.email;

                if (!customerMap[email]) {
                    customerMap[email] = {
                        id: order.id,
                        username: order.customer.name,
                        email,
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrder: order.createdAt,
                    };
                }

                customerMap[email].totalOrders += 1;
                customerMap[email].totalSpent += Number(order.total);

                if (
                    new Date(order.createdAt) >
                    new Date(customerMap[email].lastOrder)
                ) {
                    customerMap[email].lastOrder = order.createdAt;
                }
            });

            setCustomers(Object.values(customerMap));

            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            const completedOrders = formattedOrders.filter(
                (order) => order.status !== "Cancelled"
            );

            const todaySales = completedOrders
                .filter((order) => {
                    const orderDate = new Date(order.createdAt);

                    return (
                        orderDate.toDateString() ===
                        today.toDateString()
                    );
                })
                .reduce(
                    (total, order) => total + Number(order.total),
                    0
                );

            const monthSales = completedOrders
                .filter((order) => {
                    const orderDate = new Date(order.createdAt);

                    return (
                        orderDate.getMonth() === currentMonth &&
                        orderDate.getFullYear() === currentYear
                    );
                })
                .reduce(
                    (total, order) => total + Number(order.total),
                    0
                );

            // 👇 INSERT HERE
            const monthlyTotals = {
                Jan: 0,
                Feb: 0,
                Mar: 0,
                Apr: 0,
                May: 0,
                Jun: 0,
                Jul: 0,
                Aug: 0,
                Sep: 0,
                Oct: 0,
                Nov: 0,
                Dec: 0,
            };

            completedOrders.forEach((order) => {
                const month = new Date(order.createdAt).toLocaleString("default", {
                    month: "short",
                });

                monthlyTotals[month] += Number(order.total);
            });

            const monthlySales = Object.entries(monthlyTotals)
                .filter(([, sales]) => sales > 0)
                .map(([month, sales]) => ({
                    month,
                    sales,
                }));
            setMonthlySalesData(monthlySales);

            const categoryTotals = {};

            completedOrders.forEach((order) => {
                order.items.forEach((item) => {
                    const product = products.find(
                        (p) => p.id === item.product_id
                    );

                    const category = product?.category || "Other";

                    if (!categoryTotals[category]) {
                        categoryTotals[category] = 0;
                    }

                    categoryTotals[category] += Number(item.subtotal);
                });
            });

            const categorySales = Object.entries(categoryTotals).map(
                ([name, value]) => ({
                    name,
                    value,
                })
            );

            setCategorySalesData(categorySales);

            const productSales = {};

            completedOrders.forEach((order) => {
                order.items.forEach((item) => {
                    if (!productSales[item.product_id]) {
                        productSales[item.product_id] = {
                            id: item.product_id,
                            name: item.product_name,
                            quantity: 0,
                        };
                    }

                    productSales[item.product_id].quantity += Number(item.quantity);
                });
            });

            const bestSellingProducts = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            setAnalytics({
                todaySales,
                monthSales,
                totalRevenue: completedOrders.reduce(
                    (total, order) => total + Number(order.total),
                    0
                ),
                totalOrders: completedOrders.length,
                bestSellingProducts,
            });

        }

        loadOrders();
    }, []);

    const notifications = useMemo(() => {
        return products
            .filter((product) => product.stock <= 10)
            .sort((a, b) => a.stock - b.stock)
            .map((product) => ({
                id: product.id,
                message:
                    product.stock === 0
                        ? `${product.name} is OUT OF STOCK`
                        : `${product.name} is running low (${product.stock} left)`,
                type: product.stock === 0 ? "danger" : "warning",
            }));
    }, [products]);

    const dashboardStats = useMemo(() => {
        const lowStockCount = products.filter(
            (product) => product.stock <= 10,
        ).length;

        const totalStock = products.reduce(
            (total, product) =>
                total + Number(product.stock || 0),
            0,
        );

        const activeOrders = orders.filter(
            (order) =>
                !['Completed', 'Cancelled'].includes(
                    order.status,
                ),
        ).length;

        const totalSales = orders
            .filter((order) => order.status !== 'Cancelled')
            .reduce(
                (total, order) =>
                    total + Number(order.total || 0),
                0,
            );

        return {
            lowStockCount,
            totalStock,
            activeOrders,
            totalSales,
        };
    }, [orders, products]);

    const lowStockProducts = useMemo(
        () =>
            products
                .filter((product) => product.stock <= 10)
                .sort(
                    (firstProduct, secondProduct) =>
                        firstProduct.stock - secondProduct.stock,
                ),
        [products],
    );

    const filteredProducts = useMemo(() => {
        const normalizedSearch = productSearch
            .trim()
            .toLowerCase();

        return products.filter(
            (product) =>
                product.name
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                product.category
                    .toLowerCase()
                    .includes(normalizedSearch),
        );
    }, [productSearch, products]);

    const filteredCreditCustomers = useMemo(() => {
        return creditCustomers.filter((customer) =>
            customer.name
                .toLowerCase()
                .includes(creditSearch.toLowerCase())
        );
    }, [creditCustomers, creditSearch]);

    const totalCredit = useMemo(() => {
        return creditCustomers.reduce(
            (sum, customer) => sum + customer.balance,
            0
        );
    }, [creditCustomers]);

    const averageCredit = useMemo(() => {
        return creditCustomers.length
            ? totalCredit / creditCustomers.length
            : 0;
    }, [creditCustomers, totalCredit]);

    const filteredOrders = useMemo(() => {
        const normalizedSearch = orderSearch
            .trim()
            .toLowerCase();

        return orders.filter((order) => {
            const orderNumber = String(
                order.orderNumber || '',
            ).toLowerCase();

            const customerName = String(
                order.customer?.name || '',
            ).toLowerCase();

            return (
                orderNumber.includes(normalizedSearch) ||
                customerName.includes(normalizedSearch)
            );
        });
    }, [orderSearch, orders]);

    const filteredCustomers = useMemo(() => {
        const normalizedSearch = customerSearch.trim().toLowerCase();

        return customers.filter((customer) =>
            [customer.username, customer.email]
                .some((value) =>
                    String(value || '')
                        .toLowerCase()
                        .includes(normalizedSearch),
                ),
        );
    }, [customerSearch, customers]);

    function handleProductInput(event) {
        const { name, value } = event.target;

        setProductForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));

        setFormError('');
    }

    function handleProductImageChange(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setFormError('Please select a valid image file.');
            return;
        }

        const maximumFileSize = 2 * 1024 * 1024;

        if (file.size > maximumFileSize) {
            setFormError('Product image must be smaller than 2 MB.');
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            setProductForm((currentForm) => ({
                ...currentForm,
                image: reader.result,
            }));

            setFormError('');
        };

        reader.onerror = () => {
            setFormError('The image could not be uploaded.');
        };

        reader.readAsDataURL(file);
    }

    function resetProductForm() {
        setProductForm(EMPTY_PRODUCT_FORM);
        setEditingProductId(null);
        setFormError('');
    }

    function handleProductSubmit(event) {
        event.preventDefault();

        if (!productForm.name.trim()) {
            setFormError('Enter the product name.');
            return;
        }

        if (!productForm.category.trim()) {
            setFormError('Enter the product category.');
            return;
        }

        if (
            productForm.price === '' ||
            Number(productForm.price) < 0
        ) {
            setFormError('Enter a valid product price.');
            return;
        }

        if (
            productForm.stock === '' ||
            Number(productForm.stock) < 0
        ) {
            setFormError('Enter a valid stock quantity.');
            return;
        }

        const productData = {
            name: productForm.name,
            category: productForm.category,
            price: Number(productForm.price),
            oldPrice:
                productForm.oldPrice === ''
                    ? null
                    : Number(productForm.oldPrice),
            stock: Number(productForm.stock),
            image: productForm.image,
            badge: productForm.badge,
        };

        if (editingProductId !== null) {
            updateProduct(editingProductId, productData);
        } else {
            addProduct(productData);
        }

        resetProductForm();
    }

    function startEditingProduct(product) {
        setEditingProductId(product.id);

        setProductForm({
            name: product.name,
            category: product.category,
            price: String(product.price),
            oldPrice:
                product.oldPrice === null
                    ? ''
                    : String(product.oldPrice),
            stock: String(product.stock),
            image: product.image || '',
            badge: product.badge || '',
        });

        setFormError('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }

    function handleDeleteProduct(product) {
        const shouldDelete = window.confirm(
            `Delete ${product.name}?`,
        );

        if (!shouldDelete) {
            return;
        }

        deleteProduct(product.id);

        if (editingProductId === product.id) {
            resetProductForm();
        }
    }

    function handleResetProducts() {
        const shouldReset = window.confirm(
            'Reset all products to the original product list?',
        );

        if (!shouldReset) {
            return;
        }

        resetProducts();
        resetProductForm();
    }

    function addCustomer() {
        if (!customerName.trim()) return;

        const updated = [
            ...creditCustomers,
            {
                id: Date.now(),
                name: customerName,
                balance: 0,
                history: [],
            },
        ];

        setCreditCustomers(updated);
        saveCredits(updated);
        setCustomerName("");
    }

    function addCredit(id) {
        const amount = Number(creditAmounts[id]);

        if (!amount) return;

        const updated = creditCustomers.map((customer) => {
            if (customer.id !== id) return customer;

            return {
                ...customer,
                balance: customer.balance + amount,
                history: [
                    {
                        type: "Credit",
                        amount,
                        date: new Date().toLocaleDateString(),
                    },
                    ...customer.history,
                ],
            };
        });

        setCreditCustomers(updated);
        saveCredits(updated);
        setCreditAmounts((current) => ({
            ...current,
            [id]: "",
        }));
    }

    function payCredit(id) {
        const amount = Number(creditAmounts[id]);

        if (!amount) return;

        const updated = creditCustomers.map((customer) => {
            if (customer.id !== id) return customer;

            return {
                ...customer,
                balance: Math.max(
                    0,
                    customer.balance - amount
                ),
                history: [
                    {
                        type: "Payment",
                        amount,
                        date: new Date().toLocaleDateString(),
                    },
                    ...customer.history,
                ],
            };
        });

        setCreditCustomers(updated);
        saveCredits(updated);
        setCreditAmounts((current) => ({
            ...current,
            [id]: "",
        }));
    }

    async function updateOrderStatus(orderId, status) {

        const currentOrder = orders.find(
            (order) => order.id === orderId
        );

        if (!currentOrder) {
            return;
        }

        console.log("Old status:", currentOrder.status);
        console.log("New status:", status);
        console.log("Items:", currentOrder.items);

        // Inventory adjustment
        if (currentOrder.status !== status) {

            // Cancelled -> Active (deduct stock again)
            if (
                currentOrder.status === "Cancelled" &&
                status !== "Cancelled"
            ) {

                for (const item of currentOrder.items) {

                    const { data: product, error: fetchError } = await supabase
                        .from("products")
                        .select("stock")
                        .eq("id", item.product_id)
                        .single();

                    console.log("Product:", product);
                    console.log("Quantity ordered:", item.quantity);
                    console.log("Current stock:", product?.stock);
                    console.log(
                        "New stock:",
                        Number(product?.stock) - Number(item.quantity)
                    );

                    if (fetchError) {
                        console.error(fetchError);
                        return;
                    }

                    const { error: updateError } = await supabase
                        .from("products")
                        .update({
                            stock: Number(product.stock) - Number(item.quantity),
                        })
                        .eq("id", item.product_id);

                    console.log("Update error:", updateError);

                    if (updateError) {
                        console.error(updateError);
                        return;
                    }
                }
            }

            // Active -> Cancelled (restore stock)
            if (
                currentOrder.status !== "Cancelled" &&
                status === "Cancelled"
            ) {

                for (const item of currentOrder.items) {

                    const { data: product, error: fetchError } = await supabase
                        .from("products")
                        .select("stock")
                        .eq("id", item.product_id)
                        .single();

                    if (fetchError) {
                        console.error(fetchError);
                        return;
                    }

                    const { error: updateError } = await supabase
                        .from("products")
                        .update({
                            stock: Number(product.stock) + Number(item.quantity),
                        })
                        .eq("id", item.product_id);

                    if (updateError) {
                        console.error(updateError);
                        return;
                    }
                }
            }

            await loadProducts();
        }

        const { data, error } = await supabase
            .from("orders")
            .update({ status })
            .eq("id", orderId)
            .select();

        console.log("Updated data:", data);
        console.log("Update error:", error);

        if (error) {
            console.error(error);
            return;
        }

        await loadProducts();

        setOrders((currentOrders) =>
            currentOrders.map((order) =>
                order.id === orderId
                    ? { ...order, status }
                    : order
            )
        );
    }

    return (
        <div className="admin-page">
            <SiteHeader />

            <section className="admin-introduction">
                <div className="admin-container">
                    <div className="admin-breadcrumb">
                        <Link to="/">Home</Link>

                        <ChevronRight
                            size={15}
                            aria-hidden="true"
                        />

                        <span>Admin</span>
                    </div>

                    <div className="admin-title-row">
                        <span className="admin-title-icon" aria-hidden="true">
                            <LayoutDashboard size={26} strokeWidth={2} />
                        </span>

                        <div className="admin-intro-copy">
                            <span className="admin-eyebrow">Store management</span>
                            <h1 className="admin-page-title">
                                Admin Dashboard
                            </h1>
                            <p>
                                Keep Evelyn&apos;s Store stocked, organized, and ready for every order.
                            </p>
                        </div>

                        <div className="admin-title-art" aria-hidden="true">
                            <span className="admin-title-awning" />
                            <span className="admin-title-boxes" />
                            <span className="admin-title-chart" />
                        </div>

                        <span className="admin-intro-badge">
                            <span className="admin-intro-badge-dot" />
                            Store active
                        </span>
                    </div>
                </div>
            </section>

            <main className="admin-main">
                <div className="admin-container admin-body-container admin-layout">
                    <aside className="admin-sidebar">
                        <p className="admin-sidebar-label">
                            Management
                        </p>

                        <button
                            type="button"
                            className={
                                activeSection === "overview"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveSection("overview")
                            }
                        >
                            <LayoutDashboard size={18} />

                            <span style={{ flex: 1 }}>
                                Overview
                            </span>

                            {notifications.length > 0 && (
                                <span className="admin-notification-badge">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            className={
                                activeSection === 'products'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setActiveSection('products')
                            }
                        >
                            <Package size={18} />
                            Products
                        </button>

                        <button
                            type="button"
                            className={
                                activeSection === 'orders'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setActiveSection('orders')
                            }
                        >
                            <ClipboardList size={18} />
                            Orders
                        </button>

                        <button
                            type="button"
                            className={
                                activeSection === 'customers'
                                    ? 'active'
                                    : ''
                            }
                            onClick={() =>
                                setActiveSection('customers')
                            }
                        >
                            <ShoppingBag size={18} />
                            Customers
                        </button>

                        <Link
                            to="/"
                            className="admin-storefront-link"
                        >
                            View Storefront
                            <ExternalLink size={16} aria-hidden="true" />
                        </Link>
                    </aside>

                    <section
                        className={`admin-content ${
                            activeSection === 'overview'
                                ? 'admin-content--overview'
                                : activeSection === 'products'
                                    ? 'admin-content--products'
                                    : activeSection === 'orders'
                                        ? 'admin-content--orders'
                                        : activeSection === 'customers'
                                            ? 'admin-content--customers'
                                        : ''
                        }`}
                    >

                        {activeSection === 'overview' && (
                        <div className="admin-stat-grid admin-dashboard-stats">
                            <article className="admin-stat-card">
                                <span className="admin-stat-icon">
                                    <Package size={21} />
                                </span>

                                <div>
                                    <p>Total Orders</p>
                                    <strong>{analytics.totalOrders}</strong>
                                </div>
                            </article>

                            <article className="admin-stat-card">
                                <span className="admin-stat-icon">
                                    <Boxes size={21} />
                                </span>

                                <div>
                                    <p>Total Sales</p>
                                    <strong>
                                        {formatPrice(analytics.totalRevenue)}
                                    </strong>
                                </div>
                            </article>

                            <article className="admin-stat-card">
                                <span className="admin-stat-icon warning">
                                    <AlertTriangle size={21} />
                                </span>

                                <div>
                                    <p>Products</p>
                                    <strong>
                                        {products.length}
                                    </strong>
                                </div>
                            </article>

                            <article className="admin-stat-card">
                                <span className="admin-stat-icon">
                                    <ClipboardList size={21} />
                                </span>

                                <div>
                                    <p>Customers</p>
                                    <strong>
                                        {customers.length}
                                    </strong>
                                </div>
                            </article>

                            <article className="admin-stat-card">
                                <span className="admin-stat-icon">
                                    <CircleDollarSign size={21} />
                                </span>

                                <div>
                                    <p>Order Value</p>
                                    <strong>
                                        {formatPrice(
                                            dashboardStats.totalSales,
                                        )}
                                    </strong>
                                </div>
                            </article>

                            <article className="admin-stat-card">
                                <span className="admin-stat-icon">
                                    <CircleDollarSign size={21} />
                                </span>

                                <div>
                                    <p>Today's Sales</p>
                                    <strong>
                                        {formatPrice(analytics.todaySales)}
                                    </strong>
                                </div>
                            </article>

                            <article className="admin-stat-card">
                                <span className="admin-stat-icon">
                                    <CircleDollarSign size={21} />
                                </span>

                                <div>
                                    <p>This Month</p>
                                    <strong>
                                        {formatPrice(analytics.monthSales)}
                                    </strong>
                                </div>
                            </article>

                            <article className="admin-stat-card">
                                <span className="admin-stat-icon">
                                    <ShoppingBag size={21} />
                                </span>

                                <div>
                                    <p>Total Orders</p>
                                    <strong>
                                        {analytics.totalOrders}
                                    </strong>
                                </div>
                            </article>

                            <article className="admin-stat-card">
                                <span className="admin-stat-icon">
                                    <CircleDollarSign size={21} />
                                </span>

                                <div>
                                    <p>Total Revenue</p>
                                    <strong>
                                        {formatPrice(analytics.totalRevenue)}
                                    </strong>
                                </div>
                            </article>
                        </div>
                        )}

                        {activeSection === 'overview' && (
                            <>
                                <div className="admin-content-heading">
                                    <div>
                                        <h2>Dashboard Overview</h2>
                                        <p>Current information from your store.</p>
                                    </div>

                                    <span className="admin-overview-date">
                                        Live business snapshot
                                    </span>
                                </div>

                                <div className="admin-overview-grid">
                                    <article className="admin-panel admin-panel--catalog">
                                        <div className="admin-panel-heading">
                                            <div>
                                                <h3>Low-Stock Products</h3>
                                                <p>
                                                    Products with 10 items or fewer.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveSection('products')
                                                }
                                            >
                                                Manage
                                            </button>
                                        </div>

                                        {lowStockProducts.length > 0 ? (
                                            <div className="admin-compact-list">
                                                {lowStockProducts
                                                    .slice(0, 6)
                                                    .map((product) => (
                                                        <div key={product.id}>
                                                            <span className="admin-product-visual">
                                                                {product.image ? (
                                                                    <img
                                                                        src={product.image}
                                                                        alt=""
                                                                    />
                                                                ) : (
                                                                    product.emoji || <Package size={18} />
                                                                )}
                                                            </span>

                                                            <div>
                                                                <strong>
                                                                    {product.name}
                                                                </strong>
                                                                <span>
                                                                    {product.category}
                                                                </span>
                                                            </div>

                                                            <span
                                                                className={
                                                                    product.stock === 0
                                                                        ? 'admin-stock zero'
                                                                        : 'admin-stock low'
                                                                }
                                                            >
                                                                {product.stock} left
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <p className="admin-empty-message">
                                                No products are currently low in
                                                stock.
                                            </p>
                                        )}
                                    </article>

                                    <article className="admin-panel admin-panel--recent-orders">
                                        <div className="admin-panel-heading">
                                            <div>
                                                <h3>Recent Orders</h3>
                                                <p>
                                                    Latest customer transactions.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveSection('orders')
                                                }
                                            >
                                                View all
                                            </button>
                                        </div>

                                        {orders.length > 0 ? (
                                            <div className="admin-compact-list admin-recent-orders-list">
                                                {orders
                                                    .slice(0, 4)
                                                    .map((order) => (
                                                        <div
                                                            key={getOrderKey(order)}
                                                        >
                                                            <span className="admin-product-visual">
                                                                <ShoppingBag size={18} />
                                                            </span>

                                                            <div>
                                                                <strong>
                                                                    {order.orderNumber}
                                                                </strong>
                                                                <span>
                                                                    {order.customer?.name ||
                                                                        'Customer'}
                                                                </span>
                                                            </div>

                                                            <div className="admin-recent-order-value">
                                                                <strong>
                                                                    {formatPrice(order.total)}
                                                                </strong>
                                                                <span>
                                                                    {formatShortDate(order.createdAt)}
                                                                </span>
                                                            </div>

                                                            <span
                                                                className={`admin-status ${getStatusClass(
                                                                    order.status,
                                                                )}`}
                                                            >
                                                                {order.status ||
                                                                    'Preparing'}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <p className="admin-empty-message">
                                                No customer orders have been placed
                                                yet.
                                            </p>
                                        )}
                                    </article>

                                    <article className="admin-panel admin-panel--catalog">
                                        <div className="admin-panel-heading">
                                            <div>
                                                <h3>Best Selling Products</h3>
                                                <p>Top 5 products by quantity sold.</p>
                                            </div>
                                        </div>

                                        {analytics.bestSellingProducts.length > 0 ? (
                                            <div className="admin-compact-list">
                                                {analytics.bestSellingProducts.map((product) => {
                                                    const catalogProduct = products.find(
                                                        (item) => item.id === product.id,
                                                    );

                                                    return (
                                                        <div key={product.id}>
                                                            <span className="admin-product-visual">
                                                                {catalogProduct?.image ? (
                                                                    <img
                                                                        src={catalogProduct.image}
                                                                        alt=""
                                                                    />
                                                                ) : (
                                                                    <Package size={18} />
                                                                )}
                                                            </span>

                                                            <div>
                                                                <strong>{product.name}</strong>
                                                            </div>

                                                            <span className="admin-stock available">
                                                                {product.quantity} sold
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="admin-empty-message">
                                                No sales yet.
                                            </p>
                                        )}
                                    </article>

                                    <article className="admin-panel admin-panel--chart admin-panel--monthly-sales">
                                        <div className="admin-panel-heading">
                                            <div>
                                                <h3>Monthly Sales</h3>
                                                <p>Sales revenue by month.</p>
                                            </div>
                                        </div>

                                        <ResponsiveContainer width="100%" height={210}>
                                            <BarChart
                                                data={monthlySalesData}
                                                margin={{ top: 18, right: 8, left: -12, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="monthlySalesGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#20b85c" />
                                                        <stop offset="100%" stopColor="#08783e" />
                                                    </linearGradient>
                                                </defs>

                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke="#e5eee8"
                                                    strokeDasharray="4 5"
                                                />

                                                <XAxis
                                                    dataKey="month"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: "#718078", fontSize: 11, fontWeight: 700 }}
                                                />

                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: "#8a978f", fontSize: 10 }}
                                                    domain={[0, "dataMax + 100"]}
                                                    tickFormatter={(value) =>
                                                        `₱${value.toLocaleString()}`
                                                    }
                                                />

                                                <Tooltip
                                                    cursor={{ fill: "rgb(8 120 62 / 7%)" }}
                                                    contentStyle={{
                                                        border: "1px solid #dce9e0",
                                                        borderRadius: "12px",
                                                        boxShadow: "0 12px 25px rgb(31 41 51 / 12%)",
                                                        fontSize: "12px",
                                                    }}
                                                    formatter={(value) => [
                                                        formatPrice(value),
                                                        "Sales",
                                                    ]}
                                                />

                                                <Bar
                                                    dataKey="sales"
                                                    fill="url(#monthlySalesGradient)"
                                                    radius={[9, 9, 2, 2]}
                                                    maxBarSize={48}
                                                    animationDuration={900}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </article>

                                    <article className="admin-panel admin-panel--chart">
                                        <div className="admin-panel-heading">
                                            <div>
                                                <h3>Sales by Category</h3>
                                                <p>Revenue distribution across product categories.</p>
                                            </div>
                                        </div>

                                        <ResponsiveContainer width="100%" height={196}>
                                            <PieChart>
                                                <Pie
                                                    data={categorySalesData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="48%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    stroke="#ffffff"
                                                    strokeWidth={3}
                                                >
                                                    {categorySalesData.map((entry, index) => (
                                                        <Cell
                                                            key={entry.name}
                                                            fill={
                                                                CATEGORY_COLORS[
                                                                index % CATEGORY_COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    ))}
                                                </Pie>

                                                <Tooltip
                                                    contentStyle={{
                                                        border: "1px solid #dce9e0",
                                                        borderRadius: "12px",
                                                        boxShadow: "0 12px 25px rgb(31 41 51 / 12%)",
                                                        fontSize: "12px",
                                                    }}
                                                    formatter={(value) => formatPrice(value)}
                                                />

                                                <Legend
                                                    verticalAlign="bottom"
                                                    iconType="circle"
                                                    iconSize={8}
                                                    wrapperStyle={{ fontSize: "11px", fontWeight: 700 }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </article>

                                    <article className="admin-panel admin-panel--notifications">
                                        <div className="admin-panel-heading">
                                            <div>
                                                <h3>Notifications</h3>
                                                <p>Inventory alerts requiring attention.</p>
                                            </div>
                                        </div>

                                        {notifications.length > 0 ? (
                                            <div className="admin-compact-list">
                                                {notifications.map((notification) => (
                                                    <div key={notification.id}>
                                                        <span className="admin-product-visual">
                                                            <AlertTriangle
                                                                size={18}
                                                                color={
                                                                    notification.type === "danger"
                                                                        ? "#dc2626"
                                                                        : "#f59e0b"
                                                                }
                                                            />
                                                        </span>

                                                        <div>
                                                            <strong>
                                                                {notification.message}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="admin-empty-message">
                                                ✅ No inventory alerts.
                                            </p>
                                        )}
                                    </article>
                                </div>
                            </>
                        )}

                        {activeSection === 'products' && (
                            <>
                                <div className="admin-content-heading">
                                    <div>
                                        <h2>Product Management</h2>
                                        <p>
                                            Add products and update inventory.
                                        </p>
                                    </div>

                                    <div className="admin-products-heading-actions">
                                        <button
                                            type="button"
                                            className="admin-reset-button"
                                            onClick={handleResetProducts}
                                        >
                                            <RotateCcw size={17} />
                                            Reset Products
                                        </button>
                                    </div>
                                </div>

                                <form
                                    className="admin-product-form"
                                    onSubmit={handleProductSubmit}
                                >
                                    <div className="admin-form-heading">
                                        <div>
                                            <h3>
                                                {editingProductId !== null
                                                    ? 'Edit Product'
                                                    : 'Add New Product'}
                                            </h3>

                                            <p>
                                                Product changes are saved
                                                automatically.
                                            </p>
                                        </div>

                                        {editingProductId !== null && (
                                            <button
                                                type="button"
                                                onClick={resetProductForm}
                                            >
                                                Cancel Editing
                                            </button>
                                        )}
                                    </div>

                                    <div className="admin-form-grid">
                                        <label className="admin-field">
                                            <span>Product name</span>

                                            <input
                                                type="text"
                                                name="name"
                                                value={productForm.name}
                                                placeholder="Product name"
                                                onChange={handleProductInput}
                                            />
                                        </label>

                                        <label className="admin-field">
                                            <span>Category</span>

                                            <select
                                                name="category"
                                                value={productForm.category}
                                                onChange={handleProductInput}
                                            >
                                                <option value="">Select Category</option>
                                                {PRODUCT_CATEGORIES.map((category) => (
                                                    <option key={category} value={category}>
                                                        {category}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="admin-field">
                                            <span>Price</span>

                                            <input
                                                type="number"
                                                name="price"
                                                value={productForm.price}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                onChange={handleProductInput}
                                            />
                                        </label>

                                        <label className="admin-field">
                                            <span>Old price — optional</span>

                                            <input
                                                type="number"
                                                name="oldPrice"
                                                value={productForm.oldPrice}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                onChange={handleProductInput}
                                            />
                                        </label>

                                        <label className="admin-field">
                                            <span>Stock</span>

                                            <input
                                                type="number"
                                                name="stock"
                                                value={productForm.stock}
                                                min="0"
                                                step="1"
                                                placeholder="0"
                                                onChange={handleProductInput}
                                            />
                                        </label>

                                        <div className="admin-field admin-image-field">
                                            <span>Product image</span>

                                            <label className="admin-image-upload">
                                                <input
                                                    type="file"
                                                    accept="image/png, image/jpeg, image/webp"
                                                    onChange={handleProductImageChange}
                                                />

                                                <span>
                                                    {productForm.image
                                                        ? 'Change Image'
                                                        : 'Choose Image'}
                                                </span>
                                            </label>

                                            {productForm.image && (
                                                <div className="admin-image-preview">
                                                    <img
                                                        src={productForm.image}
                                                        alt="Product preview"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setProductForm((currentForm) => ({
                                                                ...currentForm,
                                                                image: '',
                                                            }))
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}

                                            {!productForm.image && (
                                                <div className="admin-image-placeholder">
                                                    <Package size={16} aria-hidden="true" />
                                                    <span>No image</span>
                                                </div>
                                            )}
                                        </div>

                                        <label className="admin-field">
                                            <span>Product badge</span>

                                            <select
                                                name="badge"
                                                value={productForm.badge}
                                                onChange={handleProductInput}
                                            >
                                                <option value="">No badge</option>
                                                <option value="Best Seller">Best Seller</option>
                                                <option value="Popular">Popular</option>
                                                <option value="New">New Arrival</option>
                                                <option value="Sale">Sale</option>
                                            </select>
                                        </label>
                                    </div>

                                    {formError && (
                                        <p className="admin-form-error">
                                            {formError}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        className="admin-save-product-button"
                                    >
                                        <Plus size={18} />

                                        {editingProductId !== null
                                            ? 'Save Changes'
                                            : 'Add Product'}
                                    </button>
                                </form>

                                <div className="admin-table-panel">
                                    <div className="admin-table-toolbar">
                                        <div>
                                            <h3>Product Inventory</h3>
                                            <p>
                                                {filteredProducts.length}{' '}
                                                {filteredProducts.length === 1
                                                    ? 'product'
                                                    : 'products'}
                                            </p>
                                        </div>

                                        <label className="admin-search-field">
                                            <Search size={17} />

                                            <input
                                                type="search"
                                                value={productSearch}
                                                placeholder="Search products..."
                                                onChange={(event) =>
                                                    setProductSearch(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>

                                    <div className="admin-table-wrapper">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Category</th>
                                                    <th>Price</th>
                                                    <th>Stock</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {filteredProducts.map(
                                                    (product) => (
                                                        <tr key={product.id}>
                                                            <td>
                                                                <div className="admin-product-cell">
                                                                    <span className="admin-product-thumbnail">
                                                                        {product.image ? (
                                                                            <img
                                                                                src={product.image}
                                                                                alt=""
                                                                            />
                                                                        ) : (
                                                                            <Package size={18} />
                                                                        )}
                                                                    </span>

                                                                    <strong>{product.name}</strong>
                                                                </div>
                                                            </td>

                                                            <td>{product.category}</td>

                                                            <td>
                                                                {formatPrice(product.price)}
                                                            </td>

                                                            <td>{product.stock}</td>

                                                            <td>
                                                                <span
                                                                    className={
                                                                        product.stock === 0
                                                                            ? 'admin-stock zero'
                                                                            : product.stock <= 10
                                                                                ? 'admin-stock low'
                                                                                : 'admin-stock available'
                                                                    }
                                                                >
                                                                    {product.stock === 0
                                                                        ? 'Out of stock'
                                                                        : product.stock <= 10
                                                                            ? 'Low stock'
                                                                            : 'Available'}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <div className="admin-table-actions">
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Edit ${product.name}`}
                                                                        onClick={() =>
                                                                            startEditingProduct(
                                                                                product,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Pencil size={16} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="danger"
                                                                        aria-label={`Delete ${product.name}`}
                                                                        onClick={() =>
                                                                            handleDeleteProduct(
                                                                                product,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeSection === 'orders' && (
                            <>
                                <div className="admin-content-heading">
                                    <div>
                                        <h2>Order Management</h2>
                                        <p>
                                            Review orders and update their status.
                                        </p>
                                    </div>

                                </div>

                                <div className="admin-table-panel">
                                    <div className="admin-table-toolbar">
                                        <div>
                                            <h3>Customer Orders</h3>
                                            <p>
                                                {filteredOrders.length}{' '}
                                                {filteredOrders.length === 1
                                                    ? 'order'
                                                    : 'orders'}
                                            </p>
                                        </div>

                                        <label className="admin-search-field">
                                            <Search size={17} />

                                            <input
                                                type="search"
                                                value={orderSearch}
                                                placeholder="Search orders..."
                                                onChange={(event) =>
                                                    setOrderSearch(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>

                                    {filteredOrders.length > 0 ? (
                                        <div className="admin-table-wrapper">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>Order</th>
                                                        <th>Customer</th>
                                                        <th>Date</th>
                                                        <th>Items</th>
                                                        <th>Total</th>
                                                        <th>Method</th>
                                                        <th>Status</th>
                                                        <th>Details</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {filteredOrders.map((order) => (
                                                        <tr
                                                            key={getOrderKey(order)}
                                                        >
                                                            <td>
                                                                <strong>
                                                                    {order.orderNumber}
                                                                </strong>
                                                            </td>

                                                            <td>
                                                                {order.customer?.name ||
                                                                    'Customer'}
                                                            </td>

                                                            <td>
                                                                {formatDate(
                                                                    order.createdAt,
                                                                )}
                                                            </td>

                                                            <td>
                                                                {getOrderItemCount(order)}
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {formatPrice(
                                                                        order.total,
                                                                    )}
                                                                </strong>
                                                            </td>

                                                            <td>
                                                                {order.fulfillmentMethod ===
                                                                    'delivery'
                                                                    ? 'Delivery'
                                                                    : 'Pickup'}
                                                            </td>

                                                            <td>
                                                                <select
                                                                    className={`admin-status-select ${getStatusClass(
                                                                        order.status,
                                                                    )}`}
                                                                    value={
                                                                        order.status ||
                                                                        'Preparing'
                                                                    }
                                                                    onChange={(event) =>
                                                                        updateOrderStatus(
                                                                            order.id,
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                >
                                                                    {ORDER_STATUSES.map(
                                                                        (status) => (
                                                                            <option
                                                                                key={status}
                                                                                value={status}
                                                                            >
                                                                                {status}
                                                                            </option>
                                                                        ),
                                                                    )}
                                                                </select>
                                                            </td>

                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="admin-view-order-button"
                                                                    onClick={() => setSelectedOrder(order)}
                                                                >
                                                                    <Eye size={16} />
                                                                    View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="admin-orders-empty">
                                            <ClipboardList size={38} />
                                            <h3>No orders found</h3>
                                            <p>
                                                Customer orders will appear here
                                                after checkout.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeSection === 'customers' && (
                            <>
                                <div className="admin-content-heading">
                                    <div>
                                        <h2>Customer Management</h2>
                                        <p>View registered customers and their purchase history.</p>
                                    </div>
                                </div>

                                <div className="admin-table-panel">
                                    <div className="admin-table-toolbar">
                                        <div>
                                            <h3>Registered Customers</h3>
                                            <p>
                                                {filteredCustomers.length}{" "}
                                                {filteredCustomers.length === 1 ? "customer" : "customers"}
                                            </p>
                                        </div>

                                        <label className="admin-search-field">
                                            <Search size={17} />

                                            <input
                                                type="search"
                                                value={customerSearch}
                                                placeholder="Search customers..."
                                                onChange={(event) =>
                                                    setCustomerSearch(event.target.value)
                                                }
                                            />
                                        </label>
                                    </div>

                                    <div className="admin-table-wrapper">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Username</th>
                                                    <th>Email</th>
                                                    <th>Orders</th>
                                                    <th>Total Spent</th>
                                                    <th>Last Order</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {filteredCustomers.map((customer) => (
                                                    <tr key={customer.email}>
                                                        <td>{customer.username}</td>
                                                        <td>{customer.email}</td>
                                                        <td>{customer.totalOrders}</td>
                                                        <td>{formatPrice(customer.totalSpent)}</td>
                                                        <td>{formatDate(customer.lastOrder)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeSection === "credit" && (
                            <>
                                <div className="admin-content-heading">
                                    <div>
                                        <h2>Credit Tracker</h2>
                                        <p>
                                            Manage customer credit balances, record payments, and
                                            monitor outstanding dues.
                                        </p>
                                    </div>
                                </div>

                                <section className="credit-summary">

                                    <div className="summary-card">
                                        <Wallet size={32} />
                                        <div>
                                            <small>Total Credit</small>
                                            <h2>{formatMoney(totalCredit)}</h2>
                                        </div>
                                    </div>

                                    <div className="summary-card">
                                        <Users size={32} />
                                        <div>
                                            <small>Customers</small>
                                            <h2>{creditCustomers.length}</h2>
                                        </div>
                                    </div>

                                    <div className="summary-card">
                                        <PhilippinePeso size={32} />
                                        <div>
                                            <small>Average Credit</small>
                                            <h2>{formatMoney(averageCredit)}</h2>
                                        </div>
                                    </div>

                                </section>

                                <section className="credit-actions">

                                    <h3>Add New Customer</h3>

                                    <p>
                                        Create a customer account to start tracking
                                        outstanding balances.
                                    </p>

                                    <div className="credit-actions-row">

                                        <input
                                            placeholder="Enter customer name"
                                            value={customerName}
                                            onChange={(e) =>
                                                setCustomerName(e.target.value)
                                            }
                                        />

                                        <button onClick={addCustomer}>
                                            <Plus size={18} />
                                            Add Customer
                                        </button>

                                    </div>

                                </section>

                                <section className="credit-search">

                                    <Search size={18} />

                                    <input
                                        placeholder="Search customer..."
                                        value={creditSearch}
                                        onChange={(e) =>
                                            setCreditSearch(e.target.value)
                                        }
                                    />

                                </section>

                                {filteredCreditCustomers.map((customer) => (

                                    <div
                                        key={customer.id}
                                        className="customer-card"
                                    >

                                        <div className="customer-top">

                                            <div>
                                                <h3>{customer.name}</h3>

                                                <p>
                                                    Outstanding Balance
                                                </p>

                                                <strong>
                                                    {formatMoney(customer.balance)}
                                                </strong>
                                            </div>

                                        </div>

                                        <div className="credit-buttons">

                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={creditAmounts[customer.id] || ""}
                                                onChange={(e) =>
                                                    setCreditAmounts((current) => ({
                                                        ...current,
                                                        [customer.id]: e.target.value,
                                                    }))
                                                }
                                            />

                                            <button
                                                onClick={() =>
                                                    addCredit(customer.id)
                                                }
                                            >
                                                Add Credit
                                            </button>

                                            <button
                                                className="pay-btn"
                                                onClick={() =>
                                                    payCredit(customer.id)
                                                }
                                            >
                                                Receive Payment
                                            </button>

                                        </div>

                                        <button
                                            className="credit-history-button"
                                            onClick={() =>
                                                setExpandedCustomer(
                                                    expandedCustomer === customer.id
                                                        ? null
                                                        : customer.id
                                                )
                                            }
                                        >
                                            {expandedCustomer === customer.id
                                                ? "Hide History"
                                                : "View History"}
                                        </button>

                                        {expandedCustomer === customer.id && (

                                            <table className="admin-table">

                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Type</th>
                                                        <th>Amount</th>
                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {customer.history.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan="3"
                                                                style={{ textAlign: "center" }}
                                                            >
                                                                No transactions
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {customer.history.map((item, index) => (
                                                        <tr key={index}>

                                                            <td>{item.date}</td>

                                                            <td>

                                                                <span
                                                                    className={
                                                                        item.type === "Payment"
                                                                            ? "history-payment"
                                                                            : "history-credit"
                                                                    }
                                                                >
                                                                    {item.type}
                                                                </span>

                                                            </td>

                                                            <td>
                                                                {formatMoney(item.amount)}
                                                            </td>

                                                        </tr>
                                                    ))}

                                                </tbody>

                                            </table>

                                        )}

                                    </div>

                                ))}

                                {creditCustomers.length === 0 && (

                                    <div className="admin-orders-empty">

                                        <Users size={44} />

                                        <h3>No credit accounts yet</h3>

                                        <p>
                                            Add your first customer to
                                            begin tracking credit.
                                        </p>

                                    </div>

                                )}
                            </>
                        )}
                    </section>
                </div>
            </main>

            {selectedOrder && (
                <div
                    className="admin-order-modal-overlay"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="admin-order-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            className="admin-order-close"
                            onClick={() => setSelectedOrder(null)}
                        >
                            ✕
                        </button>

                        <div className="admin-order-modal-header">
                            <div>
                                <span>Order details</span>
                                <h2>{selectedOrder.orderNumber}</h2>
                                <p>{formatDate(selectedOrder.createdAt)}</p>
                            </div>

                            <span
                                className={`admin-status ${getStatusClass(
                                    selectedOrder.status,
                                )}`}
                            >
                                {selectedOrder.status}
                            </span>
                        </div>

                        <section className="admin-order-summary">
                            <div className="admin-order-detail">
                                <span>Customer</span>
                                <strong>{selectedOrder.customer?.name || 'Customer'}</strong>
                                <small>{selectedOrder.customer?.email || 'No email provided'}</small>
                            </div>

                            <div className="admin-order-detail">
                                <span>Fulfillment</span>
                                <strong>
                                    {selectedOrder.fulfillmentMethod === "delivery"
                                        ? "Delivery"
                                        : "Pickup"}
                                </strong>
                                <small>{getOrderItemCount(selectedOrder)} items in this order</small>
                            </div>

                            <div className="admin-order-detail admin-order-detail--total">
                                <span>Order total</span>
                                <strong>{formatPrice(selectedOrder.total)}</strong>
                                <small>Payment summary</small>
                            </div>
                        </section>

                        <div className="admin-order-items-heading">
                            <div>
                                <h3>Items ordered</h3>
                                <p>Products included in this order.</p>
                            </div>
                            <span>{getOrderItemCount(selectedOrder)} items</span>
                        </div>

                        <div className="admin-order-items-wrapper">
                        <table className="admin-order-items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>

                            <tbody>
                                {selectedOrder.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="admin-order-product">
                                                {products.find(
                                                    (product) => product.id === item.product_id,
                                                )?.image ? (
                                                    <img
                                                        src={products.find(
                                                            (product) => product.id === item.product_id,
                                                        )?.image}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <span className="admin-order-product-fallback">
                                                        <Package size={18} />
                                                    </span>
                                                )}

                                                <span>{item.product_name}</span>
                                            </div>
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td>{formatPrice(item.price)}</td>
                                        <td>{formatPrice(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>

                        <div className="admin-order-total-row">
                            <span>Total due</span>
                            <strong>{formatPrice(selectedOrder.total)}</strong>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default AdminPage;
