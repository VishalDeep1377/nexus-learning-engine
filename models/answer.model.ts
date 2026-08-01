import mongoose,{Schema} from "mongoose";

export interface Ianswer {
    _id?: mongoose.Types.ObjectId;
    content: string;
    user: mongoose.Types.ObjectId;
    post: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    votes?: mongoose.Types.ObjectId[];
    accepted?: boolean;

}



const answerSchema = new mongoose.Schema({
    content: {
      type: String,
      required: true,
      trim: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    votes: [{
      type: Schema.Types.ObjectId,
      ref: 'Vote' 
    }],
    accepted: {
      type: Boolean,
      default: false 
    }
  });
  
  const Answer = mongoose.models.Answer  || mongoose.model<Ianswer>('Answer', answerSchema);
 export default Answer;
