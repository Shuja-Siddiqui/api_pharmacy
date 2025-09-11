const mongoose = require("mongoose");
const { Schema } = mongoose;
const invoiceItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "Product" }, // optional relation
    name: { type: String, required: true },     // product name
    quantity: { type: Number, required: true }, // how many
    rate: { type: Number, required: true },     // price per unit
    amount: { type: Number, required: true }    // quantity * rate
});
const invoiceSchema = new Schema({
    invoiceId: { type: String, required: true, unique: true }, // e.g. INV-20250911-001
    customerName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    items: [invoiceItemSchema], // list of products in invoice
    subtotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true }
}, { timestamps: true });

const InvoiceModel = new mongoose.model("Invoice", invoiceSchema);
module.exports = { InvoiceModel };


