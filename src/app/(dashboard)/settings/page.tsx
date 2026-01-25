import { SellerSettingsForm } from "@/components/settings/SellerSettingsForm";
import { getSellerSettings } from "@/lib/actions/seller.actions";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const settings = await getSellerSettings();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <BreadcrumbNav items={[
                { label: "Dashboard", href: "/" },
                { label: "Einstellungen" }
            ]} />
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Einstellungen</h1>
                <p className="text-muted-foreground">Verwalten Sie Ihre Firmeninformationen für Rechnungen.</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-950 rounded-lg border shadow-sm">
                <SellerSettingsForm settings={settings} />
            </div>
        </div>
    );
}
