import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface IPost {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  user: mongoose.Types.ObjectId;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  answers?: mongoose.Types.ObjectId[];
  votes?: mongoose.Types.ObjectId[];
  status?: 'open' | 'closed' | 'resolved';
}

const postSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  answers: [{
    type: Schema.Types.ObjectId,
    ref: 'Answer' 
  }],
  votes: [{
    type: Schema.Types.ObjectId,
    ref: 'Vote'
  }],
  status: {
    type: String,
    enum: ['open', 'closed', 'resolved'],
    default: 'open'
  }
});

const Post = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);

export default Post;

