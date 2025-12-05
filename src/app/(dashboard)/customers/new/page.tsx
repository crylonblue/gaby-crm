import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kunde hinzufügen</h1>
                <p className="text-muted-foreground">Erstellen Sie einen neuen Kundendatensatz.</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-950 rounded-lg border shadow-sm">
                <CustomerForm />
            </div>
        </div>
    );
}
