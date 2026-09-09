import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { CustomSession } from "../(user)/mentor/chat/route";
import User from "@/models/user.model";
import { connectDb } from "@/config/db.config";


export async function POST(req:NextRequest){
    const session = await getServerSession(authOptions as any) as CustomSession;
    if(!session || !session.user?.id){
        return NextResponse.json({message:"unauthorised"},{status:403});
    }

    const userId= session.user.id;
    try {
        await connectDb();
        const currentUser= await User.findById(userId);
        if (!currentUser) {
            return NextResponse.json({message:"user not found"},{status:404});
        }
        return NextResponse.json({message:"user data fetched successfully",user:currentUser},{status:200});
    } catch (error) {
        console.log("error getting in user details",error);
        return NextResponse.json({message:"error in User details"},{status:500})
    }
}