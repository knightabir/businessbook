import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: [true, "Please select a store"],
    },
    name: {
        type: String,
        required: [true, "Please enter the customer's name"],
    },
    phone: {
        type: String,
        required: [true, "Please enter the customer's phone number"],
        unique: [true, "This phone number is already associated with another customer"],
    },
    address: {
        type: String,
        required: [true, "Please enter the customer's address"],
    },
}, {
    timestamps: true,
});

const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;
