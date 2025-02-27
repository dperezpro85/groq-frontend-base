import {NextRequest, NextResponse} from "next/server"
import {getCurrentWeather} from "@/lib/tools"

export async function POST(req: NextRequest) {
    const {city} = await req.json()
    try {
        const data = await getCurrentWeather({city})
        return NextResponse.json(data, {
            status: 200
        })
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({
                error: error.message
            }, {status: 500})
        }

        return NextResponse.json({
            message: 'Internal server error'
        }, {status: 500})
    }
}