import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  CalendarHeart,
  Monitor,
  AlertCircle,
  Landmark,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contractors", label: "Contractors", icon: Users },
  { href: "/reimbursements", label: "Reimbursements", icon: Receipt },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/team", label: "Team", icon: CalendarHeart },
  { href: "/equipment", label: "Equipment", icon: Monitor },
  { href: "/obligaciones", label: "Obligaciones", icon: AlertCircle },
  { href: "/pagos", label: "Pagos", icon: Landmark },
];

export default function Sidebar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  const nav = (
    <>
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Niuro" className="sidebar-logo-img" />
        <span className="sidebar-logo-text">Niuro HR</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`sidebar-item${isActive ? " sidebar-item--active" : ""}`}>
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
    </>
  );

  return (
    <>
      <aside className="sidebar">{nav}</aside>

      <div className="mobile-header">
        <div className="mobile-header__logo">
          <img src="/logo.png" alt="Niuro" />
          <span>Niuro HR</span>
        </div>
        <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar sidebar--open">
            <button onClick={() => setMobileOpen(false)} style={{ position: "absolute", top: 14, right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
              <X size={18} />
            </button>
            {nav}
          </aside>
        </>
      )}
    </>
  );
}
