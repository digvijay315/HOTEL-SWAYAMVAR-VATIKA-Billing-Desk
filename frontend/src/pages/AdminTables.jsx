import React, { useState, useEffect } from "react";
import { UtensilsCrossed, Plus, Trash2, Users } from "lucide-react";
import { showSuccess, showError, showConfirm } from "../utils/alerts";
import { tableAPI } from "../api";

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [formData, setFormData] = useState({ tableNo: "", capacity: "" });

  const fetchTables = async () => {
    try {
      const res = await tableAPI.getTables();
      setTables(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      await tableAPI.createTable(formData);
      showSuccess("Added!", "Table has been added.");
      setFormData({ tableNo: "", capacity: "" });
      fetchTables();
    } catch (error) {
      showError("Error!", error.response?.data?.message || "Something went wrong.");
    }
  };

  const handleDeleteTable = async (id) => {
    const result = await showConfirm(
      "Are you sure?",
      "You won't be able to revert this!",
      "Yes, delete it!"
    );

    if (result.isConfirmed) {
      try {
        await tableAPI.deleteTable(id);
        showSuccess("Deleted!", "Table has been deleted.");
        fetchTables();
      } catch (error) {
        showError("Error!", error.response?.data?.message || "Failed to delete table.");
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-3">
            <UtensilsCrossed className="text-amber-500 w-8 h-8" />
            Manage Tables
          </h1>
          <p className="text-slate-400 mt-1">Add and manage restaurant tables for KOT billing.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass p-6 rounded-2xl border border-gold-800/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
            <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Plus className="text-amber-500 w-5 h-5" /> Add New Table
            </h2>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Table Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-1, Family-A"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  value={formData.tableNo}
                  onChange={(e) => setFormData({ ...formData, tableNo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 4"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Save Table
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tables.map((table) => (
              <div key={table._id} className="glass p-4 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-amber-400">{table.tableNo}</h3>
                    <div className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${table.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {table.status}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm flex items-center gap-1">
                    <Users className="w-4 h-4" /> {table.capacity} Seater
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteTable(table._id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Table"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {tables.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No tables found. Add some tables to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
