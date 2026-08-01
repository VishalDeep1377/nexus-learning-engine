import { NextResponse,NextRequest } from "next/server";
import { User, Chat, Message } from "@/models/index";
import mongoose from "mongoose";
import { connectDb } from "@/config/db.config";

export async function POST(req:NextRequest){
    const reqBody = await req.json();
    const {chatId}=reqBody;
 await connectDb();
 try {
    const chatMessages=await Chat.findById(chatId).populate<{messages:mongoose.Types.ObjectId[]}>(
        {
            path: "messages"
        }
    ).lean();
   return NextResponse.json({updatedChatMessages:chatMessages , message:"chat updated successfully"},{status:200})
 } catch (error) {
    console.log("error occured in updating current chat messages",error);
   return NextResponse.json({ message:" current chat updated failed"},{status:400})
 }

}