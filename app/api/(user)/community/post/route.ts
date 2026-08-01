import { NextRequest, NextResponse } from "next/server";
import { Post, User } from "@/models";
import { IPost } from "@/models/post.model";

export async function POST(req: NextRequest) {
    const reqBody = await req.json();
    const { title, description, userId, tags } = reqBody;
    
    try {
        const newPost = await Post.create<IPost>({
            user: userId,
            title: title,
            description: description,
            tags: tags
        });
        await newPost.save();

        const currentUser = await User.findById(userId);
        currentUser.questionsAsked.push(newPost._id);
        await currentUser.save();
        
        return NextResponse.json({
            message: "Post created successfully",
            post: newPost
        }, { status: 201 });
    } catch (error) {
        console.log("Error occurred while creating a post", error);
        return NextResponse.json({
            message: "Error occurred while creating a post"
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Fetch all posts with populated user data and sort by newest first
        const allPosts = await Post.find()
            .populate('user', 'name email')
            .populate({
                path: 'answers',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .populate('votes')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            message: "Posts fetched successfully",
            posts: allPosts
        }, { status: 200 });
    } catch (error) {
        console.log("Error getting all posts", error);
        return NextResponse.json({
            message: "Error fetching posts"
        }, { status: 500 });
    }
}