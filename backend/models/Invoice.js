const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerMobile: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
    },
    items: [
      {
        dishId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dish",
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    subTotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number pre-save if not provided
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Invoice").countDocuments();
    // E.g., BKM-10001
    this.invoiceNumber = `BKM-${10001 + count}`;
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
