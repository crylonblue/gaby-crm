import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    try {
        let query = db.select().from(invoices).orderBy(desc(invoices.date));

        if (status) {
            // @ts-ignore - drizzle type for where might complain if status is arbitrary string but it's safe for sqlite text column
            // and we want exact match.
            query = db.select().from(invoices).where(eq(invoices.status, status)).orderBy(desc(invoices.date));
        }

        const data = await query;
        return NextResponse.json(data);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
