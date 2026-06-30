import React, { useState, useEffect } from "react";
import api from "../api";
import PremiumInvoice from "../components/PremiumInvoice";
import { ShoppingBag, Search, ShoppingCart, UserCheck, Plus, Minus, Trash2, ArrowUpRight } from "lucide-react";
import { showError } from "../utils/alerts";

export default function StaffBilling() {
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Cart state
  const [cart, setCart] = useState([]);
  
  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  
  // States for billing result
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(["All"]);
  
  // Room Billing feature
  const [billType, setBillType] = useState("Walk-in"); // "Walk-in" or "Room"
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");

  useEffect(() => {
    fetchDishes();
    fetchActiveBookings();
  }, []);

  const fetchActiveBookings = async () => {
    try {
      const res = await api.get("api/room-bookings?filter=active");
      if (res.data.success) {
        setActiveBookings(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching active rooms:", error);
    }
  };

  const fetchDishes = async () => {
    try {
      const res = await api.get("api/dishes");
      if (res.data.success) {
        setDishes(res.data.dishes);
        setFilteredDishes(res.data.dishes);
        
        // Compile categories
        const cats = ["All", ...new Set(res.data.dishes.map((d) => d.category))];
        setCategories(cats);
      }
    } catch (error) {
      console.error("Error fetching dishes:", error);
    }
  };

  // Filter dishes on search or category select
  useEffect(() => {
    let result = dishes.filter((dish) => dish.available);

    if (selectedCategory !== "All") {
      result = result.filter((d) => d.category === selectedCategory);
    }

    if (search) {
      result = result.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredDishes(result);
  }, [search, selectedCategory, dishes]);

  // Cart helper functions
  const addToCart = (dish) => {
    const existing = cart.find((item) => item.dishId === dish._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.dishId === dish._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          dishId: dish._id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (dishId) => {
    setCart(cart.filter((item) => item.dishId !== dishId));
  };

  const updateQuantity = (dishId, amt) => {
    setCart(
      cart
        .map((item) => {
          if (item.dishId === dishId) {
            const nextQty = item.quantity + amt;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round((subTotal * 0.05) * 100) / 100; // 5% GST
  const grandTotal = Math.round((subTotal + tax) * 100) / 100;
  const returnAmount = receivedAmount ? Number(receivedAmount) - grandTotal : 0;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showError("Empty Basket", "Please add at least one item to the cart.");
      return;
    }
    if (!customerName || !customerMobile) {
      showError("Missing Fields", "Please fill in Customer Name and Mobile number.");
      return;
    }
    if (billType === "Room" && !selectedBookingId) {
      showError("Missing Room", "Please select a room to add the bill to.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerName,
        customerMobile,
        customerEmail,
        items: cart,
      };
      
      if (billType === "Room" && selectedBookingId) {
        payload.roomBookingId = selectedBookingId;
      }

      const res = await api.post("api/invoices", payload);

      if (res.data.success) {
        if (billType === "Room") {
          import("../utils/alerts").then(({ showSuccess }) => {
            showSuccess("Added to Room", "Restaurant bill successfully added to the room tab.");
          });
        } else {
          setGeneratedInvoice(res.data.invoice);
        }
        
        // Clear cart & inputs
        setCart([]);
        setCustomerName("");
        setCustomerMobile("");
        setCustomerEmail("");
        setReceivedAmount("");
        setSelectedBookingId("");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      showError("Checkout Failed", error.response?.data?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (e) => {
    const bId = e.target.value;
    setSelectedBookingId(bId);
    if (bId) {
      const booking = activeBookings.find(b => b._id === bId);
      if (booking && booking.guests && booking.guests.length > 0) {
        setCustomerName(booking.guests[0].name);
        setCustomerMobile(booking.guests[0].phone);
      }
    } else {
      setCustomerName("");
      setCustomerMobile("");
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60";
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 min-h-[calc(100vh-80px)] overflow-x-hidden">
      
      {/* LEFT: PRODUCTS SELECTION */}
      <div className="flex-1 flex flex-col gap-6 no-print">
        
        {/* Search and Categories Bar */}
        <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-md shadow-amber-600/10"
                    : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-850"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dish Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 content-start">
          {filteredDishes.length > 0 ? (
            filteredDishes.map((dish) => (
              <div
                key={dish._id}
                onClick={() => addToCart(dish)}
                className="glass-card rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-350 cursor-pointer flex flex-col group active:scale-[0.98] select-none"
              >
                <div className="h-32 w-full bg-slate-850 relative overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                  <span className="absolute bottom-2.5 right-2.5 bg-slate-950/80 text-amber-500 border border-amber-500/30 font-bold px-2 py-0.5 rounded-lg text-xs font-mono">
                    ₹{dish.price}
                  </span>
                </div>
                <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-amber-400 transition-colors leading-tight line-clamp-1">
                      {dish.name}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">
                      {dish.category}
                    </p>
                  </div>
                  <button className="w-full mt-auto py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/20 group-hover:bg-amber-600/10 group-hover:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all">
                    <span>Add to Cart</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] text-slate-600" />
              <p className="text-sm">No dishes found matching selection.</p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT: CART AND CHECKOUT */}
      <div className="w-full lg:w-96 flex flex-col gap-6 no-print shrink-0">
        
        {/* Cart Listing */}
        <div className="glass-card rounded-2xl flex flex-col flex-1 max-h-[480px]">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-sm text-slate-200">Current Order Basket</h2>
            </div>
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-md font-bold font-mono">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.dishId} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-amber-500 font-mono mt-0.5">
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.dishId, -1)}
                      className="p-1 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 rounded-md transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold font-mono w-6 text-center text-slate-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.dishId, 1)}
                      className="p-1 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 rounded-md transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.dishId)}
                      className="p-1 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-md transition-all ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-550 text-center gap-2">
                <ShoppingCart className="w-10 h-10 text-slate-650" />
                <p className="text-xs">Cart is empty.<br />Select products to begin bill.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/30 rounded-b-2xl divide-y divide-slate-800/80">
            <div className="flex justify-between text-xs py-1.5 text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-200">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs py-1.5 text-slate-400">
              <span>GST (5%)</span>
              <span className="font-mono text-slate-200">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 font-bold text-slate-100">
              <span>Grand Total</span>
              <span className="font-mono text-amber-400">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm text-slate-200">Customer Details</h2>
          </div>

          <div className="flex bg-slate-900 rounded-lg p-1 mb-4">
            <button
              type="button"
              onClick={() => setBillType("Walk-in")}
              className={`flex-1 text-xs py-1.5 rounded-md font-semibold transition-all ${billType === "Walk-in" ? "bg-amber-500/20 text-amber-500" : "text-slate-400 hover:text-slate-300"}`}
            >
              Walk-in
            </button>
            <button
              type="button"
              onClick={() => setBillType("Room")}
              className={`flex-1 text-xs py-1.5 rounded-md font-semibold transition-all ${billType === "Room" ? "bg-amber-500/20 text-amber-500" : "text-slate-400 hover:text-slate-300"}`}
            >
              Room Guest
            </button>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            {billType === "Room" && (
              <div>
                <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">
                  Select Room *
                </label>
                <select
                  required
                  value={selectedBookingId}
                  onChange={handleRoomSelect}
                  className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Active Room --</option>
                  {activeBookings.map(b => (
                    <option key={b._id} value={b._id}>
                      Room {b.room?.roomNumber} ({b.guests?.[0]?.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="10-digit number"
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@domain.com"
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/60"
              />
            </div>

            {billType === "Walk-in" && (
              <>
                <div className="pt-2 border-t border-slate-800/60 mt-2">
                  <label className="block text-[10px] font-bold text-amber-500/80 uppercase tracking-wider mb-1">
                    Received Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="Amount given by customer"
                    className="w-full bg-slate-900/60 border border-amber-500/30 text-amber-400 font-mono font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                {receivedAmount !== "" && (
                  <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Amount:</span>
                    <span className={`font-mono font-bold text-sm ${returnAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ₹{returnAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-600/10 active:scale-[0.98] transition-all flex items-center justify-center text-xs disabled:opacity-50 mt-2"
            >
              {loading ? "Processing..." : (billType === "Room" ? "Add Bill to Room" : "Create Invoice & Print")}
            </button>
          </form>
        </div>

      </div>

      {/* PREMIUM INVOICE POPUP MODAL */}
      {generatedInvoice && (
        <PremiumInvoice
          invoice={generatedInvoice}
          onClose={() => setGeneratedInvoice(null)}
        />
      )}

    </div>
  );
}
