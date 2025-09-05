const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      lowercase: true, // Store name in lowercase for consistency
      minlength: [2, "Product name must be at least 2 characters long"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    // description: {
    //   type: String,
    //   trim: true,
    //   maxlength: [1000, "Description cannot exceed 1000 characters"],
    // },
    // sku: {
    //   type: String,
    //   required: [true, "SKU is required"],
    //   unique: true,
    //   trim: true,
    //   uppercase: true,
    //   match: [
    //     /^[A-Z0-9-]+$/,
    //     "SKU can only contain uppercase letters, numbers, and hyphens",
    //   ],
    // },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    dosage: {
      type: String,
      required: [true, " dosage is required"],
      // min: [0, "Stock cannot be negative"],
      // default: 0,
    },
    // brand: {
    //   type: String,
    //   trim: true,
    //   maxlength: [100, "Brand name cannot exceed 100 characters"],
    // },
    // genericName: {
    //   type: String,
    //   trim: true,
    //   maxlength: [100, "Generic name cannot exceed 100 characters"],
    // },
    // discount: {
    //   type: Number,
    //   min: [0, "Discount cannot be negative"],
    //   max: [100, "Discount cannot exceed 100%"],
    //   default: 0,
    // },
    // reorderLevel: {
    //   type: Number,
    //   min: [0, "Reorder level cannot be negative"],
    //   default: 10, // Example default value
    // },

    // expiryDate: {
    //   type: Date,
    //   validate: {
    //     validator: function (v) {
    //       // Expiry date must be in the future
    //       return v > Date.now();
    //     },
    //     message: "Expiry date must be a future date",
    //   },
    // },
    // isActive: {
    //   type: Boolean,
    //   default: true,
    // },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);
const ProductModel = new mongoose.model("Product", productSchema);
module.exports = { ProductModel };
