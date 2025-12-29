"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

export function BreadcrumbNavClient() {
  const pathname = usePathname()
  
  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): BreadcrumbItemType[] => {
    const paths = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItemType[] = [
      { label: "Dashboard", href: "/" }
    ]

    let currentPath = ""
    
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Check if this is a dynamic route (like [id])
      if (segment.match(/^\d+$/)) {
        // It's an ID - use generic label, will be overridden by custom items
        const parentPath = paths.slice(0, index).join("/")
        if (parentPath === "customers") {
          breadcrumbs.push({ label: "Kunde", href: currentPath })
        } else {
          breadcrumbs.push({ label: segment, href: currentPath })
        }
      } else {
        // Regular route segment
        const label = routeLabels[currentPath] || segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
        const isLast = index === paths.length - 1
        breadcrumbs.push({
          label,
          href: isLast ? undefined : currentPath
        })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
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
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

