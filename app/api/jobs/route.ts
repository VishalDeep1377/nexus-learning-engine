import { NextResponse } from 'next/server';
import LinkedIn from 'linkedin-jobs-api';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { keyword, location, experienceLevel } = body;

        if (!keyword || !location || !experienceLevel) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const queryOptions = {
            keyword,
            location,
            dateSincePosted: 'past Week',
            jobType: 'full time',
            remoteFilter: 'remote',
            salary: '100000',
            experienceLevel,
            limit: '20',
            page: "0",
        };

        try {
            const response = await LinkedIn.query(queryOptions);
            // console.log(response)
            return NextResponse.json(response);
        } catch (linkedinError) {
            console.error('LinkedIn API Error:', linkedinError);
            return NextResponse.json(
                { error: 'Failed to fetch jobs from LinkedIn' },
                { status: 503 }
            );
        }
    } catch (error) {
        console.error('Request processing error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
} 