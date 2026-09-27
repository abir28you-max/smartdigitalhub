import { Home, ShoppingBag, ClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { icon: Home, label: "Home", to: "/" },
  { icon: ShoppingBag, label: "Products", to: "/products" },
  { icon: ClipboardList, label: "Orders", to: "/orders" },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden">
    <div className="flex items-center justify-around h-14">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-xs transition-colors ${
              isActive ? "text-primary font-semibold" : "text-muted-foreground"
            }`
          }
        >
          <tab.icon className="h-5 w-5" />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
