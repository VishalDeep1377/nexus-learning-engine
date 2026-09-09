import User from "@/models/user.model";
import { NextResponse, NextRequest } from "next/server";
import { connectDb } from "@/config/db.config";

export async function POST(req: NextRequest) {
  try {
    const reqbody = await req.json();
    const { userId, name, userName, phoneNumber, address, bio, githubUrl, linkedinUrl, gender } = reqbody;

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    await connectDb();

    // Remove any undefined or empty fields so MongoDB doesn't throw validation cast errors
    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (userName) updateData.userName = userName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (gender !== undefined) updateData.gender = gender;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean(); // Extremely important! Lean forces Mongoose to return a plain JS Object, stopping Next.js JSON circular serialization crashes.

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error("API ROUTE ERROR in editProfile:", error);
    return NextResponse.json({ message: "Something went wrong in edit profile", error: String(error) }, { status: 500 });
  }
}