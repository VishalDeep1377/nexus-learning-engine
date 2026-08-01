import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/config/db.config";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
export async function POST(req:NextRequest) {
  try {
    const reqBody = await req.json();
    const { email, password, name } = reqBody;

    if (!email || !password || !name) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    await connectDb();

    const userExists = await User.findOne({ email });

    if (userExists) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }
    const salt= await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await new User({
      email,
      password: hashedPassword,
      name,
    });

    await newUser.save();

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error in user signup", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}