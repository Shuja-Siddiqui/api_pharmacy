const Response = require("./Response");
const { SaleModel } = require("../models/SaleModel");
const { ProductModel } = require("../models");
const { DailySaleModel } = require("../models");
const { default: mongoose } = require("mongoose");
const { InvoiceModel } = require("../models/InvoiceModel");

class SalesController extends Response {
  // Record a new sale
  // recordSale = async (req, res) => {
  //   try {
  //     const { products, customerName } = req.body; // `products` should be an array of { productId, quantity } objects.
  //     // Validate input
  //     console.log(customerName);
  //     if (!Array.isArray(products) || products.length === 0) {
  //       return this.sendResponse(req, res, {
  //         data: null,
  //         message: "Products array is required and cannot be empty",
  //         status: 400,
  //       });
  //     }

  //     let totalSaleAmount = 0;
  //     let saleRecords = [];
  //     try {
  //       for (const items of products) {
  //         console.log(items);
  //         const { id, quantity } = items;
  //         console.log(id, quantity);
  //         if (!id || !quantity || quantity <= 0) {
  //           return this.sendResponse(req, res, {
  //             data: null,
  //             message:
  //               "Each product must have a valid product ID and a positive quantity",
  //             status: 400,
  //           });
  //         }

  //         // Fetch product
  //         const product = await ProductModel.findById(id);
  //         if (!product) {
  //           return this.sendResponse(req, res, {
  //             data: null,
  //             message: `Product with ID ${id} not found`,
  //             status: 404,
  //           });
  //         }

  //         // Check stock
  //         if (product.stock < quantity) {
  //           return this.sendResponse(req, res, {
  //             data: null,
  //             message: `Insufficient stock for ${product?.name}`,
  //             status: 400,
  //           });
  //         }

  //         // Calculate total price
  //         const priceAtSale = product.price;
  //         const totalPrice = priceAtSale * quantity;

  //         // Create sale record
  //         const sale = new SaleModel({
  //           product: product._id,
  //           quantity,
  //           priceAtSale,
  //           totalPrice,
  //           customerName: customerName,
  //         });
  //         await sale.save();
  //         saleRecords.push(sale);

  //         // Update product stock
  //         product.stock -= quantity;
  //         await product.save();

  //         totalSaleAmount += totalPrice;
  //       }

  //       // Update DailySales
  //       const today = new Date();
  //       today.setHours(11, 0, 0, 0); // Normalize to midnight

  //       const dailySales = await DailySaleModel.findOne({
  //         date: today,
  //       });
  //       if (dailySales) {
  //         dailySales.totalSales += totalSaleAmount;
  //         dailySales.totalTransactions += products.length;
  //         await dailySales.save();
  //       } else {
  //         // Create a new DailySales document for today
  //         const newDailySales = new DailySaleModel({
  //           date: today,
  //           totalSales: totalSaleAmount,
  //           totalTransactions: products.length,
  //         });
  //         await newDailySales.save();
  //       }

  //       return this.sendResponse(req, res, {
  //         data: { saleRecords },
  //         message: "Sales recorded successfully",
  //         status: 201,
  //       });
  //     } catch (error) {
  //       console.error(error);
  //       return this.sendResponse(req, res, {
  //         data: null,
  //         message: "Failed to record sales",
  //         status: 500,
  //       });
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     return this.sendResponse(req, res, {
  //       data: null,
  //       message: "An unexpected error occurred",
  //       status: 500,
  //     });
  //   }
  // };

  recordSale = async (req, res) => {
    try {
      const { products, customerName, invoiceId, discount, discountType } = req.body;

      if (!Array.isArray(products) || products.length === 0) {
        return this.sendResponse(req, res, {
          data: null,
          message: "Products array is required and cannot be empty",
          status: 400,
        });
      }

      let totalSaleAmount = 0;
      const saleRecords = [];
      const invoiceItems = [];

      // Process all products sequentially
      for (const item of products) {
        const { id, quantity } = item;

        if (!id || !quantity || quantity <= 0) {
          return this.sendResponse(req, res, {
            data: null,
            message: "Each product must have a valid product ID and a positive quantity",
            status: 400,
          });
        }

        // Fetch product details
        const product = await ProductModel.findById(id);
        if (!product) {
          return this.sendResponse(req, res, {
            data: null,
            message: `Product with ID ${id} not found`,
            status: 404,
          });
        }

        // Stock validation
        if (product.stock < quantity) {
          return this.sendResponse(req, res, {
            data: null,
            message: `Insufficient stock for product: ${product.name}`,
            status: 400,
          });
        }

        const priceAtSale = product.price;
        const totalPrice = priceAtSale * quantity;

        // Create sale record (with discount info)
        const sale = new SaleModel({
          product: product._id,
          quantity,
          priceAtSale,
          totalPrice,
          customerName,
          discount,
          discountType,
        });

        await sale.save();
        saleRecords.push(sale);

        // Push into invoice items
        invoiceItems.push({
          productId: product._id,
          name: product.name,
          quantity,
          rate: priceAtSale,
          amount: totalPrice,
        });

        // Update stock
        product.stock -= quantity;
        await product.save();

        totalSaleAmount += totalPrice;
      }

      // --- Discount Application ---
      let discountAmount = 0;
      if (discountType === "percentage") {
        discountAmount = (totalSaleAmount * discount) / 100;
      } else if (discountType === "amount") {
        discountAmount = discount;
      }

      const finalTotal = Math.max(totalSaleAmount - discountAmount, 0);

      // --- Create and Save Invoice ---
      const invoice = new InvoiceModel({
        invoiceId,
        customerName,
        items: invoiceItems,
        subtotal: totalSaleAmount,
        discountType,
        discountValue: discount,
        discountAmount,
        grandTotal: finalTotal,
      });

      await invoice.save();

      // --- Update Daily Sales ---
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize date (start of day)

      const dailySales = await DailySaleModel.findOne({ date: today });

      if (dailySales) {
        dailySales.totalSales += finalTotal;
        dailySales.totalTransactions += 1;
        await dailySales.save();
      } else {
        await new DailySaleModel({
          date: today,
          totalSales: finalTotal,
          totalTransactions: 1,
        }).save();
      }

      // --- Response ---
      return this.sendResponse(req, res, {
        data: { invoice, saleRecords },
        message: "Invoice generated and sales recorded successfully",
        status: 201,
      });

    } catch (error) {
      console.error("Error in recordSale:", error);
      return this.sendResponse(req, res, {
        data: null,
        message: "An unexpected error occurred while recording sale",
        status: 500,
      });
    }
  };

  getTodayTotalSales = async (req, res) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0); // Start of current day

      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 1); // Next day 00:00

      // Fetch total sales for today's range
      const dailySales = await DailySaleModel.findOne({
        date: { $gte: startOfDay, $lt: endOfDay },
      });

      const totalSales = dailySales ? dailySales.totalSales : 0;

      return this.sendResponse(req, res, {
        data: { totalSales },
        message: "Today's total sales retrieved successfully",
        status: 200,
      });
    } catch (error) {
      console.error("Error in getTodayTotalSales:", error);
      return this.sendResponse(req, res, {
        data: null,
        message: "Failed to retrieve today's total sales",
        status: 500,
      });
    }
  };


  // Get all sales (optional, with filtering)
  getAllSales = async (req, res) => {
    try {
      const sales = await SaleModel.find()
        .populate("product", "name price")
        .sort({ soldAt: -1 });
      console.log(sales);
      return this.sendResponse(req, res, {
        data: sales,
        message: "All sales retrieved successfully",
        status: 200,
      });
    } catch (error) {
      console.error(error);
      return this.sendResponse(req, res, {
        data: null,
        message: "Failed to retrieve sales",
        status: 500,
      });
    }
  };
  getAllInvoices = async (req, res) => {
    try {
      const invoice = await InvoiceModel.find()
        .sort({ soldAt: -1 });

      return this.sendResponse(req, res, {
        data: invoice,
        message: "All sales retrieved successfully",
        status: 200,
      });
    } catch (error) {
      console.error(error);
      return this.sendResponse(req, res, {
        data: null,
        message: "Failed to retrieve sales",
        status: 500,
      });
    }
  };

  getLastInvoiceNumber = async (req, res) => {
    try {
      const lastInvoice = await InvoiceModel.findOne().sort({ createdAt: -1 }); // latest by created date
      const lastInvoiceId = lastInvoice ? lastInvoice.invoiceId : null;

      return this.sendResponse(req, res, {
        data: { lastInvoiceId },
        message: "Last invoice retrieved successfully",
        status: 200,
      });
    } catch (error) {
      console.error(error);
      return this.sendResponse(req, res, {
        data: null,
        message: "Failed to retrieve last invoice",
        status: 500,
      });
    }
  };

}

module.exports = { SalesController };
