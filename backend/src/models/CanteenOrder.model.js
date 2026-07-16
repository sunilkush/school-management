import mongoose, { Schema } from "mongoose";

const canteenOrderSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName: { type: String, trim: true, default: "" },

    items: {
      type: [
        {
          itemId: { type: Schema.Types.ObjectId, ref: "CanteenItem" },
          name: { type: String, trim: true },
          price: { type: Number, min: 0 },
          quantity: { type: Number, min: 1 },
        },
      ],
      default: [],
    },

    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Completed", "Cancelled"], default: "Completed", index: true },

    orderedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

canteenOrderSchema.index({ schoolId: 1, studentId: 1, orderDate: -1 });
canteenOrderSchema.index({ schoolId: 1, status: 1 });

export const CanteenOrder =
  mongoose.models.CanteenOrder || mongoose.model("CanteenOrder", canteenOrderSchema);
