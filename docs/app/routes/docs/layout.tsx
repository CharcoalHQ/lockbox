import { NavLink, Outlet } from "react-router";
import { Nav } from "~/components/nav";
import { Footer } from "~/components/footer";

const sidebar = [
  { to: "/docs", label: "Overview" },
  { to: "/docs/getting-started", label: "Getting Started" },
  { to: "/docs/encryption", label: "Encryption & Secrets" },
  { to: "/docs/inheritance", label: "Config Inheritance" },
  { to: "/docs/sub-environments", label: "Sub-environments" },
  { to: "/docs/overrides", label: "Runtime Overrides" },
  { to: "/docs/cli", label: "CLI Reference" },
];

export default function DocsLayout() {
  return (
    <>
      <Nav />
      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-20 flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-dim mb-2">
              Documentation
            </p>
            {sidebar.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/docs"}
                className={({ isActive }) =>
                  `text-sm px-3 py-1.5 rounded-md transition-colors ${
                    isActive
                      ? "text-accent bg-accent-glow font-medium"
                      : "text-fg-muted hover:text-fg"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 max-w-3xl">
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
}
