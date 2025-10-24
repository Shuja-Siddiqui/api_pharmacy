const mongoose = require("mongoose");
const { Schema } = mongoose;

// Embedded schema for individual invoice items
const invoiceItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" }, // optional relation
  name: { type: String, required: true },                     // product name
  quantity: { type: Number, required: true },                 // quantity sold
  rate: { type: Number, required: true },                     // price per unit
  amount: { type: Number, required: true },                   // total = rate * quantity
});

// Main invoice schema
const invoiceSchema = new Schema(
  {
    invoiceId: { type: String, required: true, unique: true }, // e.g. INV-20251024-001
    customerName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    items: [invoiceItemSchema],                                // array of purchased products

    subtotal: { type: Number, required: true },                // sum before discount
    discountType: {                                            // "percentage" or "amount"
      type: String,
      enum: ["percentage", "amount", null],
      default: null,
    },
    discountValue: {                                           // numeric discount value
      type: Number,
      min: 0,
      default: 0,
    },
    discountAmount: {                                          // actual computed discount
      type: Number,
      min: 0,
      default: 0,
    },
    grandTotal: { type: Number, required: true },              // final total after discount
  },
  { timestamps: true }
);

// Model registration
const InvoiceModel = mongoose.model("Invoice", invoiceSchema);

module.exports = { InvoiceModel };
