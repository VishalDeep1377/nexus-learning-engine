import mongoose from "mongoose";

interface Imessage {
  _id?: mongoose.Types.ObjectId;
  content: String;
  senderId: mongoose.Types.ObjectId | string;
  receiverId: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
  chatId: mongoose.Types.ObjectId;
}

const messageSchema: mongoose.Schema<Imessage> = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.Mixed,
      default: "gemini",
    },
    receiverId: {
      type: mongoose.Schema.Types.Mixed,
      default: "gemini",
    },
    chatId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

const Message = mongoose.models.Message || mongoose.model<Imessage>("Message", messageSchema);
export default Message;
