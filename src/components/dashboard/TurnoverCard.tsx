import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMonthlyTurnover } from "@/lib/actions/invoice.actions";
import { Euro } from "lucide-react";

export async function TurnoverCard() {
    const turnover = await getMonthlyTurnover();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Umsatz (Aktueller Monat)
                </CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {turnover.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                    })}
                </div>
                <p className="text-xs text-muted-foreground">
                    Brutto-Umsatz im aktuellen Monat
                </p>
            </CardContent>
        </Card>
    );
}
