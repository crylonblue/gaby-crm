import { getCustomer } from "@/lib/actions/customer.actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Edit, Phone, Mail, MapPin, ArrowLeft, Calendar, FileText, HeartPulse, User } from "lucide-react";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";
import { Badge } from "@/components/ui/badge";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const customer = await getCustomer(parseInt(id));

    if (!customer) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        {customer.lastName}, {customer.firstName}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> {customer.street} {customer.houseNumber}, {customer.postalCode} {customer.city}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/customers/${customer.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Bearbeiten
                        </Link>
                    </Button>
                    <DeleteCustomerDialog
                        customerId={customer.id}
                        customerName={`${customer.firstName} ${customer.lastName}`}
                        redirectTo="/customers"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" /> Kontakt
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customer.mobilePhone && (
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Handy</span>
                                <a href={`tel:${customer.mobilePhone}`} className="text-blue-600 hover:underline flex items-center gap-2">
                                    {customer.mobilePhone}
                                </a>
                            </div>
                        )}
                        {customer.landlinePhone && (
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Festnetz</span>
                                <a href={`tel:${customer.landlinePhone}`} className="text-blue-600 hover:underline flex items-center gap-2">
                                    {customer.landlinePhone}
                                </a>
                            </div>
                        )}
                        {customer.email && (
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">E-Mail</span>
                                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> {customer.email}
                                </a>
                            </div>
                        )}
                        {!customer.mobilePhone && !customer.landlinePhone && !customer.email && (
                            <p className="text-muted-foreground italic">Keine Kontaktdaten hinterlegt.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Insurance Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HeartPulse className="h-5 w-5" /> Versicherung & Pflege
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground block">Krankenkasse</span>
                                <span className="font-medium">{customer.healthInsurance || "-"}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">Nummer</span>
                                <span className="font-medium">{customer.insuranceNumber || "-"}</span>
                            </div>
                        </div>
                        {customer.careLevel && (
                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">Pflegegrad</span>
                                <Badge variant="secondary" className="text-lg px-3 py-1">
                                    Klasse {customer.careLevel}
                                </Badge>
                            </div>
                        )}
                        {(customer.healthInsurancePhone || customer.healthInsuranceEmail) && (
                            <div className="pt-2 border-t mt-2">
                                <p className="text-sm font-medium mb-2">Kontakt zur Kasse:</p>
                                {customer.healthInsurancePhone && (
                                    <a href={`tel:${customer.healthInsurancePhone}`} className="text-sm text-blue-600 hover:underline block mb-1">
                                        Tel: {customer.healthInsurancePhone}
                                    </a>
                                )}
                                {customer.healthInsuranceEmail && (
                                    <a href={`mailto:${customer.healthInsuranceEmail}`} className="text-sm text-blue-600 hover:underline block">
                                        Mail: {customer.healthInsuranceEmail}
                                    </a>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Relative Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Angehörige(r)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {customer.relativeName ? (
                            <>
                                <p className="font-medium text-lg">{customer.relativeName}</p>
                                {customer.relativePhone && (
                                    <a href={`tel:${customer.relativePhone}`} className="text-blue-600 hover:underline flex items-center gap-2 text-sm">
                                        <Phone className="h-3 w-3" /> {customer.relativePhone}
                                    </a>
                                )}
                                {customer.relativeEmail && (
                                    <a href={`mailto:${customer.relativeEmail}`} className="text-blue-600 hover:underline flex items-center gap-2 text-sm">
                                        <Mail className="h-3 w-3" /> {customer.relativeEmail}
                                    </a>
                                )}
                            </>
                        ) : (
                            <p className="text-muted-foreground italic">Keine Angehörigen hinterlegt.</p>
                        )}
                    </CardContent>
                </Card>

                {/* General Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Allgemeines
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customer.birthDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Geboren am {new Date(customer.birthDate).toLocaleDateString("de-DE")}</span>
                            </div>
                        )}
                        {customer.notes && (
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-md border text-sm whitespace-pre-wrap">
                                {customer.notes}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Documents Info */}
                {customer.abtretungserklaerungUrl && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Dokumente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-md">
                                <span className="text-sm font-medium">Abtretungserklärung</span>
                                <Button variant="outline" size="sm" asChild>
                                    <a href={customer.abtretungserklaerungUrl} target="_blank" rel="noopener noreferrer">
                                        Ansehen
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
