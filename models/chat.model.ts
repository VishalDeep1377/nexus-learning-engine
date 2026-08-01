import mongoose from 'mongoose'
import Message from './message.model';

interface IChat{
     _id?: mongoose.Types.ObjectId;
     name:String;
     messages:mongoose.Types.ObjectId[];
     user:mongoose.Types.ObjectId;
} 

const chatSchema: mongoose.Schema<IChat> = new mongoose.Schema({
     name:{
          type:String,
          required:true
     },
     messages:[
          {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Message"
           }
        ],
     user:{
          type:mongoose.Schema.Types.ObjectId,
          required:true
     }

},{timestamps:true})

const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat",chatSchema) 

export default Chat;

