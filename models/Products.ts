import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: [true, "Store ID is required"],
    },
    name: {
        type: String,
        required: [true, "Product name is required"],
    },
    category: {
        type: String,
        required: [true, "Product category is required"],
    },
    unit: {
        type: String,
        required: [true, "Product unit is required"],
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
    },
    stockQuantity: {
        type: Number,
        required: [true, "Product stock is required"],
    },
    minStockLevel: {
        type: Number,
        required: [true, "Minimum stock is required"],
    },
    description: {
        type: String
    },
}, {
    timestamps: true,
});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
