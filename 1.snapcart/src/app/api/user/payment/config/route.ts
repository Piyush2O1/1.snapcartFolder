import { NextResponse } from "next/server";

const hasEnvValue = (value?: string) => Boolean(value && !/^add your .* here$/i.test(value))

export async function GET() {
    return NextResponse.json(
        {
            enabled: hasEnvValue(process.env.STRIPE_SECRET_KEY) && hasEnvValue(process.env.NEXT_BASE_URL),
        },
        { status: 200 }
    )
}
