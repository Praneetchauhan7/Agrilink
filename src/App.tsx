import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { LANGUAGES } from './constants/languages';
import { BENCHMARK_MARKET_PRICES } from './constants/marketIntelligence';
import { useLanguage } from './context/LanguageContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Chatbot from './components/Chatbot';

// Pages
import Landing from './pages/Landing';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerProduce from './pages/FarmerProduce';
import FarmerDemand from './pages/FarmerDemand';
import FarmerOffers from './pages/FarmerOffers';
import FarmerOrders from './pages/FarmerOrders';
import BuyerDashboard from './pages/BuyerDashboard';
import FindProduce from './pages/FindProduce';
import CreateRequirement from './pages/CreateRequirement';
import FarmerNetwork from './pages/FarmerNetwork';
import AggregatedOrders from './pages/AggregatedOrders';
import BuyerOffers from './pages/BuyerOffers';
import BuyerOrders from './pages/BuyerOrders';
import Logistics from './pages/Logistics';
import MarketPricesPage from './pages/MarketPricesPage';
import Profile from './pages/Profile';
import NotificationsPage from './pages/NotificationsPage';
import CartModal from './components/CartModal';

export default function App() {
  // Authenticated User State from active session/localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('kisansetu_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  // App active view role
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const storedRole = localStorage.getItem('kisansetu_role');
      if (storedRole === 'farmer' || storedRole === 'buyer') {
        return storedRole;
      }
      const token = localStorage.getItem('kisansetu_token');
      const stored = localStorage.getItem('kisansetu_user');
      if (token && stored) {
        const u = JSON.parse(stored);
        if (u && (u.role === 'farmer' || u.role === 'buyer')) {
          return u.role;
        }
      }
    } catch (e) {}
    return 'landing';
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const hash = window.location.hash.replace(/^#/, '').trim();
      if (hash) return hash;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam;
      const storedTab = localStorage.getItem('kisansetu_tab');
      if (storedTab) return storedTab;
    } catch (e) {}
    return 'dashboard';
  });
  const { language: currentLanguage, setLanguage: setCurrentLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Core Data Store (Persisted via SQLite Backend)
  const [produceListings, setProduceListings] = useState([]);
  const [farmerListings, setFarmerListings] = useState([]);
  const [fpoList, setFpoList] = useState([]);
  const [marketPrices, setMarketPrices] = useState<any>(BENCHMARK_MARKET_PRICES);
  const [buyerDemands, setBuyerDemands] = useState([]);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logisticsData, setLogisticsData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Persistent PostgreSQL Buyer Procurement Cart
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartSummary, setCartSummary] = useState({ totalItems: 0, totalQuantity: 0, subtotal: 0 });
  const [isPlacingCartOrder, setIsPlacingCartOrder] = useState(false);

  // Selected suppliers in basket for custom aggregation
  const [selectedSupplierBasket, setSelectedSupplierBasket] = useState([]);

  // Toast Notification System
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to sync all database tables from SQLite
  const loadDatabaseData = async () => {
    try {
      // 1. Fetch Produce Listings from SQLite
      const produceRes = await fetch('/api/produce');
      if (produceRes.ok) {
        const produceJson = await produceRes.json();
        const rawListings = produceJson.listings || [];
        const mappedListings = rawListings.map((l: any) => ({
          id: l.id,
          farmerId: l.farmer_id || l.farmerId,
          farmerName: l.farmer_name || l.farmerName || 'Farmer Producer',
          location: l.district ? `${l.district}, ${l.state || ''}`.replace(/, $/, '') : (l.location || ''),
          produce: l.crop_name || l.produce,
          variety: l.variety || 'Standard',
          emoji: (l.crop_name || l.produce || '').toLowerCase().includes('onion') ? '🧅'
               : (l.crop_name || l.produce || '').toLowerCase().includes('potato') ? '🥔'
               : (l.crop_name || l.produce || '').toLowerCase().includes('wheat') ? '🌾'
               : (l.crop_name || l.produce || '').toLowerCase().includes('grape') ? '🍇'
               : (l.crop_name || l.produce || '').toLowerCase().includes('rice') ? '🍚'
               : '🍅',
          quantity: Number(l.quantity) || 0,
          unit: l.quantity_unit || 'kg',
          quality: l.quality_grade || 'Grade A',
          expectedPrice: Number(l.expected_price) || 0,
          harvestDate: l.harvest_date || 'Current Harvest',
          storageAvailable: true,
          status: l.status === 'active' ? 'Active' : (l.status || 'Active'),
          distanceKm: 25,
          type: 'Farmer',
          rating: 4.9,
          phone: l.farmer_mobile || '+91 98765 43210'
        }));
        setProduceListings(mappedListings);
        setFarmerListings(mappedListings);
      }

      // 2. Fetch Buyer Demands from SQLite
      const demandsRes = await fetch('/api/buyer-demands');
      if (demandsRes.ok) {
        const demandsJson = await demandsRes.json();
        const rawDemands = demandsJson.demands || [];
        const mappedDemands = rawDemands.map((d: any) => {
          const qty = Number(d.required_quantity || d.quantity) || 0;
          const targetPrice = Number(d.target_price || d.price) || 2800;
          return {
            id: d.id,
            buyerId: d.buyer_id || d.buyerId,
            buyer: d.buyer_name || d.buyer_organization || 'Institutional Buyer',
            buyerName: d.buyer_name || d.buyer_organization || 'Institutional Buyer',
            buyerType: d.business_type || 'Institutional Buyer',
            location: d.district ? `${d.district}, ${d.state || ''}`.replace(/, $/, '') : (d.location || ''),
            produce: d.crop_name || d.produce || 'Produce',
            emoji: (d.crop_name || d.produce || '').toLowerCase().includes('onion') ? '🧅'
                 : (d.crop_name || d.produce || '').toLowerCase().includes('potato') ? '🥔'
                 : (d.crop_name || d.produce || '').toLowerCase().includes('wheat') ? '🌾'
                 : (d.crop_name || d.produce || '').toLowerCase().includes('grape') ? '🍇'
                 : (d.crop_name || d.produce || '').toLowerCase().includes('rice') ? '🍚'
                 : '🍅',
            quantity: qty,
            quantityRequired: qty,
            requiredQuantity: qty,
            unit: d.quantity_unit || 'kg',
            targetPrice: targetPrice,
            expectedPriceRange: `₹${targetPrice.toLocaleString()} / quintal`,
            quality: d.quality_requirement || d.quality || 'Grade A',
            delivery: d.delivery_location || (d.district ? `${d.district} Central Distribution Center` : 'Central Distribution Center'),
            deliveryLocation: d.delivery_location || (d.district ? `${d.district} Central Distribution Center` : 'Central Distribution Center'),
            deadline: d.required_by || 'Current Month',
            requiredBy: d.required_by || 'Current Month',
            status: d.status === 'open' || d.status === 'active' ? 'Open' : (d.status || 'Open'),
            paymentTerms: 'Escrow Guarantee (Direct Bank Transfer upon QC)',
            specialRequirements: d.special_requirements || 'Grade A sorted produce',
            type: 'Institutional Buyer'
          };
        });
        setBuyerDemands(mappedDemands);
      }

      // 3. Fetch Offers from SQLite
      const offersRes = await fetch('/api/offers');
      if (offersRes.ok) {
        const offersJson = await offersRes.json();
        const rawOffers = offersJson.offers || [];
        const mappedOffers = rawOffers.map((o: any) => {
          const qty = Number(o.quantity || o.quantityOffered) || 0;
          const price = Number(o.offered_price || o.price) || 0;
          return {
            id: o.id,
            listingId: o.listing_id,
            farmerName: o.farmer_name || 'Farmer Producer',
            buyerName: o.buyer_name || o.buyer_organization || 'Institutional Buyer',
            produce: o.crop_name || 'Produce',
            emoji: (o.crop_name || '').toLowerCase().includes('onion') ? '🧅'
                 : (o.crop_name || '').toLowerCase().includes('potato') ? '🥔'
                 : (o.crop_name || '').toLowerCase().includes('wheat') ? '🌾'
                 : (o.crop_name || '').toLowerCase().includes('grape') ? '🍇'
                 : '🍅',
            quantity: qty,
            quantityOffered: qty,
            price: price,
            offeredPrice: price,
            unit: o.quantity_unit || 'kg',
            status: (o.status || 'pending').toLowerCase() === 'accepted' ? 'Accepted'
                  : (o.status || 'pending').toLowerCase() === 'rejected' ? 'Rejected'
                  : (o.status || 'pending').toLowerCase() === 'countered' ? 'Countered'
                  : 'Pending',
            date: o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Today',
            message: o.message,
            notes: o.message || 'Direct procurement proposal'
          };
        });
        setOffers(mappedOffers);
      }

      // 4. Fetch Transactions from PostgreSQL
      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const txJson = await txRes.json();
        setTransactions(txJson.transactions || []);
      }

      // 5. Fetch Notifications from PostgreSQL
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifJson = await notifRes.json();
        const rawNotifs = notifJson.notifications || [];
        const mappedNotifs = rawNotifs.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          unread: !n.is_read,
          type: n.type,
          related_entity_id: n.related_entity_id,
          related_entity_type: n.related_entity_type,
          recipient_id: n.recipient_id
        }));
        if (mappedNotifs.length > 0) {
          setNotifications(mappedNotifs);
        }
      }

      // 6. Fetch Orders from Database
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json();
        const rawOrders = ordersJson.orders || [];
        const mappedOrders = rawOrders.map((ord: any) => {
          const qty = Number(ord.quantity || ord.totalQuantity) || 2500;
          const price = Number(ord.agreed_price || ord.averagePrice) || 2800;
          const totalVal = Number(ord.total_amount || ord.estimatedTotalValue) || Math.round((qty / 100) * price);
          const stepIdx = ord.status === 'completed' ? 5 : ord.status === 'dispatched' ? 4 : ord.status === 'escrow_funded' ? 3 : ord.status === 'confirmed' ? 2 : 1;
          return {
            id: ord.id,
            orderType: ord.order_type || (qty >= 5000 ? 'Aggregated' : 'Direct'),
            buyer: ord.buyer_name || ord.buyer_organization || 'Institutional Buyer',
            buyerLocation: 'Distribution Center',
            produce: ord.crop_name || ord.produce || 'Produce',
            emoji: (ord.crop_name || ord.produce || '').toLowerCase().includes('onion') ? '🧅'
                 : (ord.crop_name || ord.produce || '').toLowerCase().includes('potato') ? '🥔'
                 : (ord.crop_name || ord.produce || '').toLowerCase().includes('wheat') ? '🌾'
                 : (ord.crop_name || ord.produce || '').toLowerCase().includes('grape') ? '🍇'
                 : '🍅',
            grade: 'Grade A',
            totalQuantity: qty,
            quantity: qty,
            unit: ord.quantity_unit || 'kg',
            averagePrice: price,
            price: price,
            estimatedTotalValue: totalVal,
            totalAmount: totalVal,
            deliveryLocation: ord.delivery_location || '',
            pickupLocation: ord.pickup_location || '',
            logistics: ord.logistics || null,
            expectedDate: '2026-09-08',
            createdDate: ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Today',
            estimatedDeliveryDate: ord.delivery_date || 'Within 48h',
            paymentStatus: ord.status === 'completed' ? 'Paid via Escrow' : 'Escrow Held (100% Secured)',
            orderStatus: ord.status === 'completed' ? 'Delivered' : ord.status === 'dispatched' ? 'In Transit' : ord.status === 'escrow_funded' ? 'Escrow Funded' : 'Confirmed',
            currentStep: stepIdx,
            stepIndex: stepIdx,
            steps: [
              'Requirement Created',
              'Farmers Matched',
              'Offers Sent',
              'Suppliers Confirmed',
              'Logistics',
              'Delivered'
            ],
            suppliers: ord.suppliers || [
              { name: ord.farmer_name || 'Farmer Producer', type: 'Farmer', quantity: qty, price: price, location: 'Regional Mandi', pickupStatus: 'Scheduled' }
            ]
          };
        });
        setOrders(mappedOrders);
      }

      // 5. Fetch Logistics from SQLite
      const logRes = await fetch('/api/logistics');
      if (logRes.ok) {
        const logJson = await logRes.json();
        const records = logJson.logistics || [];
        setLogisticsData(records);
        setOrders((prev) => prev.map((order) => {
          const logistics = records.find((record) => record.order_id === order.id) || order.logistics || null;
          return logistics
            ? { ...order, logistics, pickupLocation: logistics.pickup_location || '', deliveryLocation: logistics.delivery_location || '' }
            : order;
        }));
      }

      // 6. Fetch Cart from PostgreSQL
      const buyerId = currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1');
      const cartRes = await fetch(`/api/cart?buyerId=${buyerId}`);
      if (cartRes.ok) {
        const cartJson = await cartRes.json();
        if (cartJson.success) {
          setCartItems(cartJson.items || []);
          setCartSummary(cartJson.summary || { totalItems: 0, totalQuantity: 0, subtotal: 0 });
        }
      }
    } catch (err) {
      console.warn('Could not sync with database backend:', err);
    }
  };

  const fetchCart = async () => {
    try {
      const buyerId = currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1');
      const res = await fetch(`/api/cart?buyerId=${buyerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCartItems(data.items || []);
          setCartSummary(data.summary || { totalItems: 0, totalQuantity: 0, subtotal: 0 });
        }
      }
    } catch (err) {
      console.warn('Could not fetch cart items:', err);
    }
  };

  const handleAddToCart = async (farmer: any, customQty?: number) => {
    try {
      const buyerId = currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1');
      const qty = customQty || Number(farmer.quantity || farmer.currentStockKg) || 100;
      const unitPrice = Number(farmer.expectedPrice || farmer.expected_price || farmer.unitPrice) || 2800;
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId,
          listingId: farmer.id || farmer.listingId || null,
          cropName: farmer.produce || farmer.crop_name || farmer.cropName || 'Produce',
          variety: farmer.variety || null,
          farmerId: farmer.farmerId || farmer.farmer_id || null,
          farmerName: farmer.farmerName || farmer.farmer_name || farmer.name || 'Verified Farmer',
          quantity: qty,
          quantityUnit: farmer.unit || farmer.quantity_unit || 'kg',
          unitPrice,
          priceUnit: farmer.priceUnit || farmer.price_unit || 'Rs/quintal',
          qualityGrade: farmer.quality || farmer.quality_grade || 'Grade A',
          location: farmer.location || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchCart();
        addToast(
          'Added to Cart',
          `${farmer.produce || farmer.crop_name || 'Produce'} (${qty} ${farmer.unit || 'kg'}) added to your procurement cart.`,
          'success'
        );
      } else {
        addToast('Cart Error', data.message || 'Failed to add item to cart.', 'error');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      addToast('Network Error', 'Could not add produce to cart.', 'error');
    }
  };

  const handleUpdateCartQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Error updating cart quantity:', err);
    }
  };

  const handleRemoveCartItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Error removing cart item:', err);
    }
  };

  const handlePlaceOrderFromCart = async () => {
    setIsPlacingCartOrder(true);
    try {
      const buyerId = currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1');
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadDatabaseData();
        await fetchCart();
        addToast(
          'Order Placed Successfully!',
          `${data.orders?.length || 1} procurement order(s) placed with escrow protection.`,
          'success'
        );
        setIsCartOpen(false);
        handleNavigateTab('orders');
        return { success: true, orders: data.orders };
      } else {
        addToast('Checkout Failed', data.message || 'Failed to place order from cart.', 'error');
        return { success: false };
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      addToast('Network Error', 'Could not complete cart checkout.', 'error');
      return { success: false };
    } finally {
      setIsPlacingCartOrder(false);
    }
  };

  const handleNavigateTab = (newTab: string) => {
    const cleanTab = (newTab || 'dashboard').trim();
    setActiveTab(cleanTab);
    try {
      localStorage.setItem('kisansetu_tab', cleanTab);
      if (window.location.hash !== `#${cleanTab}`) {
        window.history.replaceState(null, '', `#${cleanTab}`);
      }
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '').trim();
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
        try {
          localStorage.setItem('kisansetu_tab', hash);
        } catch (e) {}
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab && currentRole !== 'landing') {
      try {
        localStorage.setItem('kisansetu_tab', activeTab);
        if (window.location.hash !== `#${activeTab}`) {
          window.history.replaceState(null, '', `#${activeTab}`);
        }
      } catch (e) {}
    }
  }, [activeTab, currentRole]);

  const handleSearchSubmit = (query: string) => {
    const cleanQuery = (query || '').trim();
    setSearchQuery(cleanQuery);
    if (currentRole === 'buyer') {
      handleNavigateTab('find-produce');
    } else if (currentRole === 'farmer') {
      const lower = cleanQuery.toLowerCase();
      if (lower.includes('price') || lower.includes('rate') || lower.includes('mandi')) {
        handleNavigateTab('market-prices');
      } else {
        handleNavigateTab('buyer-demand');
      }
    }
  };

  const getNotificationDestination = (notif: any, role: string): string => {
    if (!notif) return 'dashboard';
    const type = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const msg = (notif.message || '').toLowerCase();
    const entityType = (notif.related_entity_type || '').toLowerCase();

    // 1. Offers / Negotiations -> offers
    if (
      entityType === 'offer' ||
      type.includes('offer') ||
      type.includes('counter') ||
      type.includes('negotiat') ||
      title.includes('offer') ||
      title.includes('counter') ||
      title.includes('bid') ||
      title.includes('proposal') ||
      msg.includes('offer') ||
      msg.includes('counter-offer')
    ) {
      return 'offers';
    }

    // 2. Transactions, Escrow, Payments, Contracts -> orders (which hosts transactions & orders)
    if (
      entityType === 'transaction' ||
      entityType === 'escrow' ||
      entityType === 'order' ||
      type.includes('transaction') ||
      type.includes('payment') ||
      type.includes('escrow') ||
      type.includes('order') ||
      type.includes('payout') ||
      title.includes('transaction') ||
      title.includes('payment') ||
      title.includes('escrow') ||
      title.includes('order') ||
      msg.includes('transaction') ||
      msg.includes('escrow') ||
      msg.includes('order') ||
      msg.includes('payment')
    ) {
      return 'orders';
    }

    // 3. Buyer Demands / Procurement Requests
    if (
      entityType === 'demand' ||
      entityType === 'buyer_demand' ||
      type.includes('demand') ||
      type.includes('requirement') ||
      title.includes('demand') ||
      title.includes('requirement') ||
      msg.includes('demand') ||
      msg.includes('requirement')
    ) {
      return role === 'farmer' ? 'buyer-demand' : 'create-requirement';
    }

    // 4. Aggregated Orders
    if (
      entityType === 'aggregated_order' ||
      type.includes('aggregation') ||
      title.includes('aggregation') ||
      msg.includes('aggregation')
    ) {
      return role === 'buyer' ? 'aggregated-orders' : 'orders';
    }

    // 5. Produce / Listings
    if (
      entityType === 'produce' ||
      type.includes('produce') ||
      type.includes('listing') ||
      title.includes('produce') ||
      title.includes('listing') ||
      msg.includes('produce') ||
      msg.includes('listing')
    ) {
      return role === 'farmer' ? 'produce' : 'find-produce';
    }

    // 6. Market Prices
    if (
      type.includes('price') ||
      type.includes('mandi') ||
      type.includes('market') ||
      title.includes('price') ||
      title.includes('rate') ||
      title.includes('mandi') ||
      msg.includes('price') ||
      msg.includes('rate') ||
      msg.includes('mandi')
    ) {
      return 'market-prices';
    }

    // 7. Logistics
    if (
      type.includes('logistics') ||
      type.includes('shipment') ||
      type.includes('truck') ||
      title.includes('logistics') ||
      title.includes('dispatch') ||
      title.includes('tracking') ||
      msg.includes('logistics') ||
      msg.includes('shipment')
    ) {
      return 'logistics';
    }

    return 'dashboard';
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif) return;

    // Mark as read in state
    setNotifications((prev: any[]) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );

    // Call API to mark as read in SQLite database
    if (notif.id) {
      try {
        const recipientId = currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1');
        await fetch(`/api/notifications/${notif.id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId }),
        });
      } catch (e) {
        console.warn('Could not mark notification as read:', e);
      }
    }

    // Close notification dropdown
    setIsNotifOpen(false);

    // Navigate to appropriate view
    const destination = getNotificationDestination(notif, currentRole);
    handleNavigateTab(destination);
  };

  // Initial load from SQLite database on component mount
  useEffect(() => {
    loadDatabaseData();
  }, []);

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
  };

  // Switch Role with Optional User Details from Login Form
  const handleSelectRole = (role, userDetails = null) => {
    setCurrentRole(role);
    try {
      localStorage.setItem('kisansetu_role', role);
    } catch (e) {}
    handleNavigateTab('dashboard');
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (userDetails) {
      setCurrentUser({
        ...userDetails,
        role: role
      });
    }
    // Refresh database records on login
    loadDatabaseData();
  };

  const handleToggleRole = () => {
    if (currentRole === 'farmer') {
      setCurrentRole('buyer');
      try {
        localStorage.setItem('kisansetu_role', 'buyer');
      } catch (e) {}
      handleNavigateTab('dashboard');
      setCurrentUser((prev) => ({
        ...prev,
        role: 'buyer',
        name: prev.role === 'buyer' ? prev.name : 'FreshMart Foods',
        location: ''
      }));
    } else {
      setCurrentRole('farmer');
      try {
        localStorage.setItem('kisansetu_role', 'farmer');
      } catch (e) {}
      handleNavigateTab('dashboard');
      setCurrentUser((prev) => ({
        ...prev,
        role: 'farmer',
        name: prev.role === 'farmer' ? prev.name : 'Ramesh Kumar',
        location: ''
      }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kisansetu_token');
    localStorage.removeItem('kisansetu_user');
    localStorage.removeItem('kisansetu_role');
    localStorage.removeItem('kisansetu_tab');
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {}
    sessionStorage.clear();
    setCurrentUser(null);
    setCurrentRole('landing');
    setActiveTab('dashboard');
  };

  // Farmer Handlers (Persisted to SQLite)
  const handleAddProduce = async (newProduce) => {
    try {
      const response = await fetch('/api/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: currentUser.id || 'farmer-1',
          crop_name: newProduce.produce,
          quantity: newProduce.quantity,
          quantity_unit: newProduce.unit || 'kg',
          expected_price: newProduce.expectedPrice,
          quality_grade: newProduce.quality || 'Grade A',
          harvest_date: newProduce.harvestDate || null,
          state: 'Maharashtra',
          district: 'Nashik',
          market_location: 'Nashik APMC Mandi',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        loadDatabaseData();
      }
    } catch (err) {
      console.error('Error publishing produce to database:', err);
    }

    setProduceListings((prev) => [newProduce, ...prev]);
    setFarmerListings((prev) => [newProduce, ...prev]);
  };

  const handleEditProduce = async (updated) => {
    try {
      await fetch(`/api/produce/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: currentUser.id || 'farmer-1',
          crop_name: updated.produce,
          quantity: updated.quantity,
          expected_price: updated.expectedPrice,
          quality_grade: updated.quality,
          harvest_date: updated.harvestDate || null,
        }),
      });
      loadDatabaseData();
    } catch (err) {
      console.error('Error editing produce:', err);
    }
    setProduceListings((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setFarmerListings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleDeleteProduce = async (id) => {
    try {
      await fetch(`/api/produce/${id}?farmerId=${currentUser.id || 'farmer-1'}`, {
        method: 'DELETE',
      });
      loadDatabaseData();
    } catch (err) {
      console.error('Error deleting produce:', err);
    }
    setProduceListings((prev) => prev.filter((p) => p.id !== id));
    setFarmerListings((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFarmerSubmitOffer = async (newOffer) => {
    try {
      await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: newOffer.listingId || 'LST-101',
          buyer_id: currentUser.id || 'buyer-1',
          offered_price: newOffer.offeredPrice,
          quantity: newOffer.quantityOffered,
          quantity_unit: 'kg',
          message: newOffer.message || `Offer from ${currentUser.name}`,
        }),
      });
      loadDatabaseData();
    } catch (err) {
      console.error('Error submitting offer:', err);
    }
    setOffers((prev) => [newOffer, ...prev]);
    addToast('Offer Sent!', `Proposal sent to ${newOffer.buyerName} for ${newOffer.quantityOffered.toLocaleString()} kg @ ₹${newOffer.offeredPrice}/q.`, 'success');
    setActiveTab('offers');
  };

  // Buyer Handlers
  const handleAddToRequirementList = (supplier) => {
    if (selectedSupplierBasket.includes(supplier.id)) {
      setSelectedSupplierBasket((prev) => prev.filter((id) => id !== supplier.id));
    } else {
      setSelectedSupplierBasket((prev) => [...prev, supplier.id]);
    }
  };

  const handleAcceptOffer = async (offerOrId: any) => {
    const offer = typeof offerOrId === 'object' ? offerOrId : offers.find((o: any) => o.id === offerOrId);
    const offerId = offer?.id || offerOrId;
    try {
      const res = await fetch(`/api/offers/${offerId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1'),
          actor_role: currentRole
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast('Error Accepting Offer', data.error || 'Failed to accept offer.', 'error');
        return;
      }
      await loadDatabaseData();
      addToast('Contract Finalized!', `Offer accepted! Contract #${data.transaction?.id || ''} created with escrow pending.`, 'success');
    } catch (err) {
      console.error('Error accepting offer:', err);
      addToast('Network Error', 'Could not reach server to accept offer.', 'error');
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/offers/${offerId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1'),
          actor_role: currentRole
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast('Error Declining Offer', data.error || 'Failed to update offer.', 'error');
        return;
      }
      await loadDatabaseData();
      addToast('Offer Declined', 'Offer marked as declined.', 'info');
    } catch (err) {
      console.error('Error rejecting offer:', err);
      addToast('Network Error', 'Could not reach server to decline offer.', 'error');
    }
  };

  const handleSendCounterOffer = async (offerId: string, counterData: any) => {
    try {
      const price = typeof counterData === 'object' ? counterData.offered_price || counterData.counterPrice : counterData;
      const quantity = typeof counterData === 'object' ? counterData.quantity || counterData.counterQuantity : undefined;
      const message = typeof counterData === 'object' ? counterData.message || counterData.notes : undefined;

      const res = await fetch(`/api/offers/${offerId}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1'),
          actor_role: currentRole,
          counter_price: Number(price),
          counter_quantity: quantity ? Number(quantity) : undefined,
          message: message || `Counter proposal of ₹${price}/q proposed`
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast('Error Sending Counter', data.error || 'Failed to send counter offer.', 'error');
        return;
      }
      await loadDatabaseData();
      addToast('Counter-Offer Dispatched', `Counter proposal of ₹${price}/q sent!`, 'success');
    } catch (err) {
      console.error('Error sending counter offer:', err);
      addToast('Network Error', 'Could not reach server to send counter offer.', 'error');
    }
  };

  // Update 5-Stage Contract Transaction Status
  const handleUpdateTransactionStatus = async (transactionId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          actor_id: currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1'),
          actor_role: currentRole
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast('Status Update Failed', data.error || 'Failed to update transaction.', 'error');
        return;
      }
      await loadDatabaseData();
      addToast('Transaction Status Updated', `Contract status updated to "${newStatus}".`, 'success');
    } catch (err) {
      console.error('Error updating transaction status:', err);
      addToast('Network Error', 'Could not reach server to update transaction status.', 'error');
    }
  };

  // Create Aggregated Order from Smart Match
  const handleCreateAggregatedOrder = async (orderData) => {
    const newOrder = {
      id: `ORD-AGG-${Date.now().toString().slice(-4)}`,
      orderType: 'Aggregated',
      produce: orderData.produce || 'Tomatoes',
      grade: orderData.grade || 'Grade A',
      totalQuantity: orderData.totalQuantity || orderData.quantity || 10000,
      totalAmount: orderData.totalAmount || (orderData.quantity || 10000) * 28.5,
      deliveryLocation: orderData.deliveryLocation || 'FreshMart Distribution Hub, Pune',
      expectedDate: orderData.expectedDate || '2026-09-08',
      currentStep: 1,
      status: 'Escrow Funded',
      suppliers: orderData.suppliers || [
        { name: 'Ramesh Kumar', type: 'Smallholder Farmer', quantity: 2500, price: 2850, location: 'Nashik', pickupStatus: 'Scheduled' },
        { name: 'Sahyadri Farmers Producer Co.', type: 'FPO Cluster', quantity: 4500, price: 2820, location: 'Dindori', pickupStatus: 'Scheduled' },
        { name: 'Suresh Patil', type: 'Farmer', quantity: 3000, price: 2850, location: 'Pimpalgaon', pickupStatus: 'Scheduled' }
      ]
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: 'farmer-1',
          buyer_id: currentUser.id || 'buyer-1',
          crop_name: newOrder.produce,
          quantity: newOrder.totalQuantity,
          quantity_unit: 'kg',
          agreed_price: 28.5,
        }),
      });
      loadDatabaseData();
    } catch (err) {
      console.error('Error saving order to SQLite:', err);
    }

    setOrders((prev) => [newOrder, ...prev]);
    setSelectedSupplierBasket([]);
    addToast('Aggregated Order Created!', `Combined 3-farmer order initialized for ${newOrder.totalQuantity.toLocaleString()} kg with escrow protection.`, 'success');
    setActiveTab('aggregated-orders');
  };

  const handleSaveOrderLogistics = async (orderId, locations) => {
    const response = await fetch('/api/logistics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        pickup_location: locations.pickupLocation.trim() || null,
        delivery_location: locations.deliveryLocation.trim() || null,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to save order locations');
    }
    const logistics = result.logistics;
    setLogisticsData((prev) => [
      ...prev.filter((record) => record.order_id !== orderId),
      logistics,
    ]);
    setOrders((prev) => prev.map((order) => order.id === orderId
      ? { ...order, logistics, pickupLocation: logistics.pickup_location || '', deliveryLocation: logistics.delivery_location || '' }
      : order));
    return logistics;
  };

  // Advance Order Workflow Step
  const handleAdvanceOrderStep = async (orderId) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const nextStep = Math.min(o.currentStep + 1, 5);
          const stepNames = [
            '',
            'Requirement Defined',
            'Suppliers Confirmed & Aggregated',
            'Escrow Funded',
            'Farm-Gate Dispatch',
            'Delivered & Escrow Released'
          ];
          const newStatus = nextStep === 5 ? 'Completed' : nextStep >= 3 ? 'In Progress' : 'Pending';

          addToast(
            'Order Milestone Advanced',
            `Order #${o.id} progressed to: ${stepNames[nextStep]}`,
            'info'
          );

          // Update SQLite order status
          fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus.toLowerCase().replace(/\s+/g, '_') }),
          }).catch(console.warn);

          return {
            ...o,
            currentStep: nextStep,
            status: newStatus
          };
        }
        return o;
      })
    );
  };

  const handleMarkAllNotifsRead = async () => {
    setNotifications((prev) => prev.map((n: any) => ({ ...n, unread: false })));
    try {
      const recipientId = currentUser?.id || (currentRole === 'buyer' ? 'buyer-1' : 'farmer-1');
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });
    } catch (e) {
      console.warn('Could not mark all notifications as read:', e);
    }
  };

  // If in Landing mode
  if (currentRole === 'landing') {
    return (
      <div className="app-root">
        <Landing 
          onSelectRole={handleSelectRole}
          currentLanguage={currentLanguage}
          onSelectLanguage={handleLanguageChange}
        />
        <Chatbot 
          currentLanguage={currentLanguage}
          currentRole="farmer"
        />
        <div className="toast-container">
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onClose={removeToast} />
          ))}
        </div>
      </div>
    );
  }

  // Calculate badge counts
  const badgeCounts = {
    farmerProduce: produceListings.length,
    buyerDemand: buyerDemands.length,
    farmerOffers: offers.filter((o) => o.status === 'Pending').length,
    farmerOrders: orders.length,
    buyerOffers: offers.filter((o) => o.status === 'Pending').length,
    buyerOrders: orders.length,
    aggregatedOrders: orders.filter((o) => o.orderType === 'Aggregated').length,
    unreadNotifs: notifications.filter((n) => n.unread).length
  };

  return (
    <div className="app-root">
      <div className="dashboard-layout">
        {/* Persistent Modular Sidebar */}
        <Sidebar 
          role={currentRole}
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={handleNavigateTab}
          onSwitchRole={handleToggleRole}
          onLogout={handleLogout}
          counts={badgeCounts}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <div className="dashboard-main">
          {/* Top Navbar */}
          <Navbar 
            role={currentRole}
            currentUser={currentUser}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            currentLanguage={currentLanguage}
            onSelectLanguage={handleLanguageChange}
            notifications={notifications}
            isNotifOpen={isNotifOpen}
            setIsNotifOpen={setIsNotifOpen}
            onMarkAllNotifsRead={handleMarkAllNotifsRead}
            onNotificationClick={handleNotificationClick}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onLogout={handleLogout}
            cartCount={cartSummary.totalItems}
            onOpenCart={() => setIsCartOpen(true)}
          />

          {/* Dynamic Page Router based on activeTab & currentRole */}
          <main className="dashboard-content">
            {/* FARMER VIEWS */}
            {currentRole === 'farmer' && (
              <>
                {activeTab === 'dashboard' && (
                  <FarmerDashboard 
                    farmerName={currentUser?.name || "Farmer"}
                    location={currentUser?.location || ''}
                    produceListings={produceListings}
                    marketPrices={marketPrices}
                    buyerDemands={buyerDemands}
                    offers={offers}
                    orders={orders}
                    onNavigate={handleNavigateTab}
                    onOpenAddProduceModal={() => handleNavigateTab('produce')}
                    onSubmitOfferClick={(demand) => {
                      handleNavigateTab('buyer-demand');
                    }}
                    onSearch={handleSearchSubmit}
                  />
                )}

                {activeTab === 'produce' && (
                  <FarmerProduce 
                    produceListings={produceListings}
                    offers={offers}
                    onAddProduce={handleAddProduce}
                    onEditProduce={handleEditProduce}
                    onDeleteProduce={handleDeleteProduce}
                    onAcceptOffer={handleAcceptOffer}
                    onRejectOffer={handleRejectOffer}
                  />
                )}

                {activeTab === 'market-prices' && (
                  <MarketPricesPage 
                    marketPrices={marketPrices}
                    searchQuery={searchQuery}
                  />
                )}

                {activeTab === 'buyer-demand' && (
                  <FarmerDemand 
                    buyerDemands={buyerDemands}
                    farmerListings={farmerListings}
                    onSubmitOffer={handleFarmerSubmitOffer}
                    searchQuery={searchQuery}
                  />
                )}

                {activeTab === 'offers' && (
                  <FarmerOffers 
                    offers={offers}
                    currentUserId={currentUser?.id}
                    onAcceptOffer={handleAcceptOffer}
                    onRejectOffer={handleRejectOffer}
                    onSendCounterOffer={handleSendCounterOffer}
                  />
                )}

                {activeTab === 'orders' && (
                  <FarmerOrders 
                    orders={orders}
                    transactions={transactions}
                    onUpdateTransactionStatus={handleUpdateTransactionStatus}
                    onSaveLogistics={handleSaveOrderLogistics}
                    onNavigate={handleNavigateTab}
                  />
                )}

                {activeTab === 'logistics' && (
                  <Logistics 
                    logisticsData={logisticsData}
                  />
                )}

                {activeTab === 'notifications' && (
                  <NotificationsPage 
                    role="farmer"
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllRead={handleMarkAllNotifsRead}
                  />
                )}

                {activeTab === 'profile' && (
                  <Profile 
                    role="farmer"
                    currentUser={currentUser}
                    farmerName={currentUser?.name || "Farmer"}
                    onUpdateUser={(user) => {
                      setCurrentUser(user);
                      localStorage.setItem('agrilink_user', JSON.stringify(user));
                    }}
                    onLogout={handleLogout}
                  />
                )}
              </>
            )}

            {/* BUYER VIEWS */}
            {currentRole === 'buyer' && (
              <>
                {activeTab === 'dashboard' && (
                  <BuyerDashboard 
                    buyerName={currentUser?.name || "Procurement Manager"}
                    location={currentUser?.location || ''}
                    farmerListings={farmerListings}
                    buyerDemands={buyerDemands}
                    orders={orders}
                    offers={offers}
                    onNavigate={handleNavigateTab}
                    onOpenCreateRequirement={() => handleNavigateTab('create-requirement')}
                    onLaunchAggregation={(order) => handleCreateAggregatedOrder(order)}
                    onSearch={handleSearchSubmit}
                  />
                )}

                {activeTab === 'find-produce' && (
                  <FindProduce 
                    farmerListings={farmerListings}
                    selectedSupplierIds={selectedSupplierBasket}
                    onAddToRequirementList={handleAddToRequirementList}
                    onTriggerAggregation={() => handleNavigateTab('create-requirement')}
                    onAddToCart={handleAddToCart}
                    cartItems={cartItems}
                    initialSearchQuery={searchQuery}
                  />
                )}

                {activeTab === 'create-requirement' && (
                  <CreateRequirement 
                    farmerListings={farmerListings}
                    onCreateAggregatedOrder={handleCreateAggregatedOrder}
                    onSendOffers={() => {
                      addToast('Offers Dispatched', 'Purchase orders sent to matching regional suppliers!', 'success');
                      handleNavigateTab('aggregated-orders');
                    }}
                  />
                )}

                {activeTab === 'farmer-network' && (
                  <FarmerNetwork 
                    fpoList={fpoList}
                    farmerListings={farmerListings}
                    onSelectFPO={() => {
                      handleNavigateTab('create-requirement');
                    }}
                  />
                )}

                {activeTab === 'aggregated-orders' && (
                  <AggregatedOrders 
                    orders={orders}
                    onAdvanceStep={handleAdvanceOrderStep}
                    onNavigate={handleNavigateTab}
                  />
                )}

                {activeTab === 'offers' && (
                  <BuyerOffers 
                    offers={offers}
                    currentUserId={currentUser?.id}
                    onAcceptOffer={handleAcceptOffer}
                    onRejectOffer={handleRejectOffer}
                    onSendCounterOffer={handleSendCounterOffer}
                  />
                )}

                {activeTab === 'orders' && (
                  <BuyerOrders 
                    orders={orders}
                    transactions={transactions}
                    onUpdateTransactionStatus={handleUpdateTransactionStatus}
                    onSaveLogistics={handleSaveOrderLogistics}
                    onUpdateStep={handleAdvanceOrderStep}
                    onNavigate={handleNavigateTab}
                  />
                )}

                {activeTab === 'logistics' && (
                  <Logistics 
                    logisticsData={logisticsData}
                  />
                )}

                {activeTab === 'market-prices' && (
                  <MarketPricesPage 
                    marketPrices={marketPrices}
                    searchQuery={searchQuery}
                  />
                )}

                {activeTab === 'notifications' && (
                  <NotificationsPage 
                    role="buyer"
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllRead={handleMarkAllNotifsRead}
                  />
                )}

                {activeTab === 'profile' && (
                  <Profile 
                    role="buyer"
                    currentUser={currentUser}
                    buyerName={currentUser?.name || "Buyer"}
                    onUpdateUser={(user) => {
                      setCurrentUser(user);
                      localStorage.setItem('agrilink_user', JSON.stringify(user));
                    }}
                    onLogout={handleLogout}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Persistent PostgreSQL Buyer Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        cartSummary={cartSummary}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onPlaceOrder={handlePlaceOrderFromCart}
        onNavigate={setActiveTab}
        isPlacingOrder={isPlacingCartOrder}
      />

      {/* Agriculture Assistant Floating Chatbot */}
      <Chatbot 
        currentLanguage={currentLanguage}
        currentRole={currentRole}
      />

      {/* Floating Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
}
