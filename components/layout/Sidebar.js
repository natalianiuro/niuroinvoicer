import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  CalendarHeart,
  Monitor,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contractors", label: "Contractors", icon: Users },
  { href: "/reimbursements", label: "Reimbursements", icon: Receipt },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/team", label: "Team", icon: CalendarHeart },
  { href: "/equipment", label: "Equipment", icon: Monitor },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Niuro" className="sidebar-logo-img" />
        <span className="sidebar-logo-text">Niuro HR</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item${isActive ? " sidebar-item--active" : ""}`}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link href="/invoices/generator" className="sidebar-generator-link">
          <FileText size={14} />
          <span>Invoice Generator</span>
        </Link>
      </div>
    </aside>
  );
}
