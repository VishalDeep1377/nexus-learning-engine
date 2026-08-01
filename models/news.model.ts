import mongoose from "mongoose";

interface Inews {
  _id?: mongoose.Types.ObjectId;
  author: string | null;
  title: string;
  description: string | undefined;
  url: string | undefined;
  imageUrl: string | undefined;
  source: string | undefined;
  publishedAt: Date;
}

const NewsSchema: mongoose.Schema<Inews> = new mongoose.Schema(
  {
    author: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    url: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    source: {
      type: String,
    },
    publishedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const News =
  mongoose.models.News || mongoose.model<Inews>("News", NewsSchema);
export default News;