import mongoose,{Schema} from "mongoose";

export interface Ivote{
    _id?: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    voteType: 'up' | 'down';
    answer?: mongoose.Types.ObjectId;
    post?: mongoose.Types.ObjectId;
    createdAt?: Date;

}

const voteSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    voteType: {
      type: String,
      enum: ['up', 'down'],
      required: true
    },
    answer: {
      type: Schema.Types.ObjectId,
      ref: 'Answer'
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const Vote = mongoose.models.Vote || mongoose.model<Ivote>('Vote', voteSchema);
export default Vote;
