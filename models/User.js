import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: String,
  totalPoints: { type: Number, default: 0 },
  flagsPoints: { type: Number, default: 0 }
});

export default mongoose.model("User", userSchema);
