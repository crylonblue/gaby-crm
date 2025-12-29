"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importCustomers } from "@/lib/actions/customer.actions";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { NewCustomer } from "@/db/schema";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<NewCustomer[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setPreviewData([]);
        }
    };

    const mapRowToCustomer = (row: any): NewCustomer => {
        // Simple heuristic mapping
        return {
            firstName: row["Vorname"] || row["firstName"] || "",
            lastName: row["Nachname"] || row["lastName"] || "",
            email: row["Email"] || row["email"] || null,
            street: row["Straße"] || row["street"] || null,
            houseNumber: row["Hausnummer"] || row["houseNumber"] || null,
            postalCode: row["PLZ"] || row["postalCode"] || null,
            city: row["Ort"] || row["city"] || null,
            mobilePhone: row["Handy"] || row["mobilePhone"] || null,
            landlinePhone: row["Festnetz"] || row["landlinePhone"] || null,
            birthDate: row["Geburtsdatum"] || row["birthDate"] || null,
            insuranceNumber: row["Versicherungsnummer"] || row["insuranceNumber"] || null,
            healthInsurance: row["Krankenkasse"] || row["healthInsurance"] || null,
            healthInsuranceEmail: row["Krankenkasse Email"] || row["healthInsuranceEmail"] || null,
            careLevel: row["Pflegegrad"] || row["careLevel"] || null,
            notes: row["Notizen"] || row["notes"] || null,
        } as NewCustomer;
    };

    const handleParse = () => {
        if (!file) return;

        setIsParsing(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const mappedData = results.data.slice(0, 5).map(mapRowToCustomer);
                setPreviewData(mappedData);
                setIsParsing(false);
            },
            error: (error) => {
                console.error(error);
                toast.error("Fehler beim Parsen der CSV-Datei.");
                setIsParsing(false);
            }
        });
    };

    const handleImport = () => {
        if (!file) return;

        setIsImporting(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const mappedData = results.data.map(mapRowToCustomer);
                    // Filter out invalid rows (e.g. missing required fields)
                    const validData = mappedData.filter(c => c.firstName && c.lastName);

                    if (validData.length === 0) {
                        toast.error("Keine gültigen Datensätze gefunden (Vorname/Nachname erforderlich).");
                        setIsImporting(false);
                        return;
                    }

                    const result = await importCustomers(validData);
                    if (result.success) {
                        toast.success(`${result.count} Kunden erfolgreich importiert.`);
                        setFile(null);
                        setPreviewData([]);
                    } else {
                        toast.error(result.error);
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Import fehlgeschlagen.");
                } finally {
                    setIsImporting(false);
                }
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <BreadcrumbNav items={[
                { label: "Dashboard", href: "/" },
                { label: "Kunden", href: "/customers" },
                { label: "Import" }
            ]} />
            <h1 className="text-3xl font-bold">Kunden Import</h1>

            <Card>
                <CardHeader>
                    <CardTitle>CSV Datei auswählen</CardTitle>
                    <CardDescription>
                        Laden Sie eine CSV-Datei hoch. Die erste Zeile muss die Spaltennamen enthalten (z.B. Vorname, Nachname, Email, Straße, PLZ, Ort).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                            />
                        </div>
                        <Button onClick={handleParse} disabled={!file || isParsing || isImporting}>
                            {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Vorschau laden
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {previewData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Vorschau (Erste 5 Einträge)</CardTitle>
                        <CardDescription>
                            Bitte überprüfen Sie, ob die Daten korrekt zugeordnet wurden.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nachname</TableHead>
                                        <TableHead>Vorname</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Ort</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((customer, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{customer.lastName}</TableCell>
                                            <TableCell>{customer.firstName}</TableCell>
                                            <TableCell>{customer.email}</TableCell>
                                            <TableCell>{customer.city}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleImport} disabled={isImporting}>
                                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Jetzt Importieren
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
