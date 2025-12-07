import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText, Users, ArrowRight } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TurnoverCard } from "@/components/dashboard/TurnoverCard";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Willkommen bei GabyCRM.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Turnover Card */}
        <TurnoverCard />

        {/* Quick Action: Add Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Kunde hinzufügen
            </CardTitle>
            <CardDescription>
              Legen Sie einen neuen Kundendatensatz an.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/customers/new">
                Jetzt erstellen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Action: Create Invoice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Rechnung erstellen
            </CardTitle>
            <CardDescription>
              Erfassen Sie eine neue Rechnung für einen Kunden.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/invoices/new">
                Rechnung erfassen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Action: View Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-600" />
              Kundenliste
            </CardTitle>
            <CardDescription>
              Sehen Sie alle gespeicherten Kunden ein.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/customers">
                Zur Übersicht
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Action: View Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Rechnungsliste
            </CardTitle>
            <CardDescription>
              Verwalten Sie alle erstellten Rechnungen.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/invoices">
                Zur Übersicht
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
