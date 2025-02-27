// src/app/api/courses/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {getCourses} from '@/services/courseService';

export async function POST(request: NextRequest) {
    try {
        const {datestart = '2025-03-01'} = await request.json();
        const results = await getCourses(datestart);
        return NextResponse.json({data: results});
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({error: error.message}, {status: 500});
        }
        return NextResponse.json({error: 'Bad request'}, {status: 500});
    }
}