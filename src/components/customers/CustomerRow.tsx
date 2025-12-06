"use client";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Edit } from "lucide-react";
import { Customer } from "@/db/schema";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import { useRouter } from "next/navigation";

interface CustomerRowProps {
    customer: Customer & { yearlyBudget?: number };
}

export function CustomerRow({ customer }: CustomerRowProps) {
    const router = useRouter();

    const handleRowClick = () => {
        router.push(`/customers/${customer.id}`);
    };

    return (
        <TableRow
            className="group cursor-pointer hover:bg-muted/50"
            onClick={handleRowClick}
        >
            <TableCell className="font-medium p-0">
                <Link href={`/customers/${customer.id}`} className="block p-4" onClick={(e) => e.stopPropagation()}>
                    {customer.lastName}
                </Link>
            </TableCell>
            <TableCell className="p-0">
                <Link href={`/customers/${customer.id}`} className="block p-4" onClick={(e) => e.stopPropagation()}>
                    {customer.firstName}
                </Link>
            </TableCell>
            <TableCell className="p-0">
                <Link href={`/customers/${customer.id}`} className="block p-4" onClick={(e) => e.stopPropagation()}>
                    {customer.city}
                </Link>
            </TableCell>
            <TableCell className="p-0">
                <Link href={`/customers/${customer.id}`} className="block p-4 font-mono text-right pr-8" onClick={(e) => e.stopPropagation()}>
                    {(customer.yearlyBudget || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </Link>
            </TableCell>
            <TableCell className="p-0">
                <Link href={`/customers/${customer.id}`} className="block p-4" onClick={(e) => e.stopPropagation()}>
                    {customer.careLevel || "-"}
                </Link>
            </TableCell>
            <TableCell className="flex items-center gap-2 p-4">
                <Button asChild variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/customers/${customer.id}/edit`}>
                        <Edit className="h-4 w-4" />
                    </Link>
                </Button>
                <div onClick={(e) => e.stopPropagation()}>
                    <DeleteCustomerDialog
                        customerId={customer.id}
                        customerName={`${customer.firstName} ${customer.lastName}`}
                        className="shadow-none"
                    />
                </div>
            </TableCell>
        </TableRow>
    );
}
