import mongoose,{Schema} from "mongoose";
const streamSchema = new Schema({
  name: {
    type: String, // Science / Commerce / Arts
    required: true,
  },
});

export default mongoose.model("Stream", streamSchema);