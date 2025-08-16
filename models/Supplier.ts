import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: [true, "Please select a store"],
    },
    name: {
        type: String,
        required: [true, "Please enter the supplier's name"],
    },
    phone: {
        type: String,
        required: [true, "Please enter the supplier's phone number"],
        unique: [true, "This phone number is already associated with another supplier"],
    },
    address: {
        type: String,
        required: [true, "Please enter the supplier's address"],
    }
}, { timestamps: true });

const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema);
export default Supplier;