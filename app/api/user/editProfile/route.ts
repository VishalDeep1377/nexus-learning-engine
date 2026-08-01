import { User } from "@/models";
import { NextResponse,NextRequest } from "next/server";

export async function POST(req:NextRequest){
const reqbody=await req.json();
const {userId,name,email,phoneNumber,adress}=reqbody;

try{
const currentUser= await User.findById(userId);
console.log("revieved the request for update");
return NextResponse.json({message:"update request recieved"});

}catch (error) {
    return NextResponse.json({message:"something went wrong in edit profile"})
}

}