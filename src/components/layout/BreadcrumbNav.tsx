import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbItemType {
  label: string
  href?: string
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItemType[]
}

// Map routes to breadcrumb labels
const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/customers": "Kunden",
  "/customers/new": "Neuer Kunde",
  "/customers/import": "Kunden Import",
  "/invoices": "Rechnungen",
  "/invoices/new": "Neue Rechnung",
}

const segmentLabels: Record<string, string> = {
  "customers": "Kunden",
  "invoices": "Rechnungen",
  "new": "Neu",
  "edit": "Bearbeiten",
  "import": "Import",
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  // If custom items are provided, use them
  if (items) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Otherwise, generate from pathname (client-side only)
  return null
}

