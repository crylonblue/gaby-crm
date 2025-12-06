import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    try {
        let conditions = [];

        if (status) {
            conditions.push(eq(invoices.status, status));
        }

        if (from) {
            // Compare date string YYYY-MM-DD
            conditions.push(gte(invoices.date, from));
        }

        if (to) {
            // Compare date string YYYY-MM-DD
            conditions.push(lte(invoices.date, to));
        }

        // @ts-ignore
        const query = db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.date));

        const data = await query;
        return NextResponse.json(data);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
