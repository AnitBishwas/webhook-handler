import mongoose from "mongoose";

const deliveredOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
});

const DeliveredOrderModel = mongoose.model(
  "DeliveredOrder",
  deliveredOrderSchema
);

export default DeliveredOrderModel;
