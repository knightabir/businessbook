import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Store Name is required"],
    },
    gstNumber: {
      type: String,
    },
    contact: {
      countryCode: {
        type: String,
        required: [true, "Country Code is required"],
      },
      phone: {
        type: String,
        required: [true, "Phone Number is required"],
      },
    },
    address: {
      villageOrTown: {
        type: String,
        required: [true, "Village/Town is required"],
      },
      post: {
        type: String,
        required: [true, "Post is required"],
      },
      police: {
        type: String,
        required: [true, "Police Station is required"],
      },
      district: {
        type: String,
        required: [true, "District is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
      },
    },
  },
  { timestamps: true }
);

const Store = mongoose.models.Store || mongoose.model("Store", storeSchema);

export default Store;