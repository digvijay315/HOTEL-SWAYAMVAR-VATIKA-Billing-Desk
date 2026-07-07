import React, { useState, useEffect } from "react";
import api, { tableAPI, orderAPI } from "../api";
import { UtensilsCrossed, Users, Plus, Minus, Trash2, Search, ArrowUpRight, ArrowLeft } from "lucide-react";
import { showError, showSuccess } from "../utils/alerts";
import ThermalReceipt from "../components/ThermalReceipt";

export default function StaffKotBilling() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Menu Data
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Order Data
  const [cart, setCart] = useState([]);
  const [initialCart, setInitialCart] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  
  // View states
  const [view, setView] = useState("tables"); // "tables" or "order"
  const [loading, setLoading] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isKotPrint, setIsKotPrint] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchDishes();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await tableAPI.getTables();
      setTables(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDishes = async () => {
    try {
      const res = await api.get("api/dishes");
      if (res.data.success) {
        setDishes(res.data.dishes);
        setFilteredDishes(res.data.dishes);
        const cats = ["All", ...new Set(res.data.dishes.map((d) => d.category))];
        setCategories(cats);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let result = dishes.filter((dish) => dish.available);
    if (selectedCategory !== "All") {
      result = result.filter((d) => d.category === selectedCategory);
    }
    if (search) {
      result = result.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    setFilteredDishes(result);
  }, [search, selectedCategory, dishes]);

  const handleTableClick = async (table) => {
    setSelectedTable(table);
    setCart([]);
    setInitialCart([]);
    setActiveOrderId(null);
    setView("order");

    if (table.status === "Occupied") {
      try {
        const res = await orderAPI.getActiveOrder(table._id);
        if (res.data.data) {
          const orderData = res.data.data;
          setActiveOrderId(orderData._id);
          setCart(orderData.items);
          setInitialCart(JSON.parse(JSON.stringify(orderData.items)));
        }
      } catch (error) {
        console.error("Error fetching active order", error);
      }
    }
  };

  const goBackToTables = () => {
    setView("tables");
    setSelectedTable(null);
    fetchTables();
  };

  const addToCart = (dish) => {
    const existing = cart.find((item) => item.dishId === dish._id);
    if (existing) {
      setCart(cart.map((item) => item.dishId === dish._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { dishId: dish._id, name: dish.name, price: dish.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (dishId) => {
    setCart(cart.filter((item) => item.dishId !== dishId));
  };

  const updateQuantity = (dishId, amt) => {
    setCart(
      cart.map((item) => {
        if (item.dishId === dishId) {
          const nextQty = item.quantity + amt;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round((subTotal * 0.05) * 100) / 100; // 5% GST
  const grandTotal = Math.round((subTotal + tax) * 100) / 100;

  const handleSaveOrder = async () => {
    if (cart.length === 0) {
      showError("Empty Order", "Please add items to the KOT.");
      return;
    }

    // Compute newly added items for the kitchen print
    const newKotItems = [];
    cart.forEach(currentItem => {
      const oldItem = initialCart.find(i => i.dishId === currentItem.dishId);
      const oldQty = oldItem ? oldItem.quantity : 0;
      const diffQty = currentItem.quantity - oldQty;
      if (diffQty > 0) {
        newKotItems.push({
          ...currentItem,
          quantity: diffQty
        });
      }
    });

    setLoading(true);
    try {
      await orderAPI.createOrUpdateOrder({
        tableId: selectedTable._id,
        items: cart,
        subTotal,
        tax,
        grandTotal
      });
      
      if (newKotItems.length > 0) {
        setIsKotPrint(true);
        setGeneratedInvoice({
          tableNo: "Table " + selectedTable.tableNo,
          items: newKotItems,
          createdAt: new Date().toISOString()
        });
      } else {
        showSuccess("Saved", "Order updated! No new items to print for KOT.");
        goBackToTables();
      }
    } catch (error) {
      showError("Save Failed", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!activeOrderId) return;
    setLoading(true);
    try {
      const res = await orderAPI.checkoutOrder(activeOrderId);
      if (res.data.success) {
        setIsKotPrint(false);
        setGeneratedInvoice(res.data.data);
      }
    } catch (error) {
      showError("Checkout Failed", error.response?.data?.message || "Failed to generate bill.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseReceipt = () => {
    setGeneratedInvoice(null);
    goBackToTables();
  };

  if (view === "tables") {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
        <h1 className="text-2xl font-bold text-amber-500 mb-6 flex items-center gap-2">
          <UtensilsCrossed /> KOT Billing Tables
        </h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map(table => (
            <div 
              key={table._id}
              onClick={() => handleTableClick(table)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all transform active:scale-95 flex flex-col justify-between h-32
                ${table.status === 'Available' 
                  ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/10' 
                  : 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20 shadow-lg shadow-red-500/10'
                }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-2xl font-bold text-slate-100">{table.tableNo}</span>
                <Users className={`w-5 h-5 ${table.status === 'Available' ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: table.status === 'Available' ? '#34d399' : '#f87171' }}>
                  {table.status}
                </p>
                <p className="text-xs text-slate-400">{table.capacity} Seater</p>
              </div>
            </div>
          ))}
          {tables.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500">
              No tables found. Please ask Admin to add tables.
            </div>
          )}
        </div>

        {/* Generate Invoice Overlay */}
        {generatedInvoice && (
          <ThermalReceipt invoice={generatedInvoice} isKot={isKotPrint} onClose={handleCloseReceipt} />
        )}
      </div>
    );
  }

  // ORDER VIEW
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 min-h-[calc(100vh-80px)]">
      {/* LEFT: MENU ITEMS */}
      <div className="flex-1 flex flex-col gap-4 no-print">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
          <button onClick={goBackToTables} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-200">
            Table <span className="text-amber-500">{selectedTable?.tableNo}</span>
          </h2>
          <span className={`px-2 py-1 text-xs rounded-md font-bold uppercase ${selectedTable?.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {selectedTable?.status}
          </span>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 rounded-xl py-2 pl-10 pr-4 text-xs outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === cat ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dish Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 content-start" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {filteredDishes.map((dish) => (
            <div key={dish._id} onClick={() => addToCart(dish)} className="glass-card rounded-xl overflow-hidden cursor-pointer hover:border-amber-500/40 active:scale-95 transition-all">
              <div className="h-24 w-full relative">
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" onError={(e)=>{e.target.src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=60"}} />
                <span className="absolute bottom-1 right-1 bg-slate-900/90 text-amber-400 px-1.5 py-0.5 rounded text-xs font-bold">₹{dish.price}</span>
              </div>
              <div className="p-1.5 px-2">
                <h3 className="font-bold text-xs text-slate-200 truncate leading-tight">{dish.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: CART / KOT */}
      <div className="w-full lg:w-96 flex flex-col gap-4 no-print shrink-0">
        <div className="glass-card rounded-2xl flex flex-col flex-1 h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center rounded-t-2xl">
            <h3 className="font-bold text-slate-200">Current KOT</h3>
            <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs font-bold">{cart.length} Items</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-800/50">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.dishId} className="py-2 flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-amber-500">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.dishId, -1)} className="p-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs font-bold w-4 text-center text-slate-200">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.dishId, 1)} className="p-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => removeFromCart(item.dishId)} className="p-1 text-red-400 hover:bg-red-500/20 rounded ml-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">No items in KOT. Add dishes from the menu.</div>
            )}
          </div>

          <div className="p-4 bg-slate-900/40 border-t border-slate-800 rounded-b-2xl">
            <div className="flex justify-between text-xs py-1 text-slate-400"><span>Subtotal</span><span>₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs py-1 text-slate-400"><span>GST (5%)</span><span>₹{tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-100 py-1.5 border-t border-slate-700 mt-1"><span>Grand Total</span><span className="text-amber-400">₹{grandTotal.toFixed(2)}</span></div>
            
            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={handleSaveOrder}
                disabled={loading || cart.length === 0}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                Save / Send to Kitchen
              </button>
              
              {selectedTable?.status === "Occupied" && (
                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  Generate Bill & Print
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Invoice Overlay for Order View */}
      {generatedInvoice && (
        <ThermalReceipt invoice={generatedInvoice} isKot={isKotPrint} onClose={handleCloseReceipt} />
      )}
    </div>
  );
}
