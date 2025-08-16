import mongoose from "mongoose";

const productInSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the product name"],
    },
    price: {
      type: Number,
      required: [true, "Please enter the product price"],
    },
    quantity: {
      type: Number,
      required: [true, "Please enter the product quantity"],
    },
    unit: {
      type: String,
      required: [true, "Please enter the product unit"],
    },
    total: {
      type: Number,
      required: [true, "Please enter the product total"],
    },
  },
  { _id: false }
);

const salesSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Please select a store"],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Please select a customer"],
    },
    products: {
      type: [productInSaleSchema],
      required: [true, "Please add at least one product"],
      validate: [
        (arr: any[]) => Array.isArray(arr) && arr.length > 0,
        "Please add at least one product",
      ],
    },
    totalAmount: {
      type: Number,
      required: [true, "Please enter the total amount"],
    },
    paidAmount: {
      type: Number,
      required: [true, "Please enter the paid amount"],
    },
    dueAmount: {
      type: Number,
      required: [true, "Please enter the due amount"],
    },
    status: {
      type: String,
      required: [true, "Please select a status"],
    },
  },
  { timestamps: true }
);

const Sale = mongoose.models.Sale || mongoose.model("Sale", salesSchema);
export default Sale;