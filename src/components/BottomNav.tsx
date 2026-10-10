import { Home, ShoppingBag, ClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { icon: Home, label: "Home", to: "/" },
  { icon: ShoppingBag, label: "Products", to: "/products" },
  { icon: ClipboardList, label: "Orders", to: "/orders" },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg md:hidden gpu-smooth">
    <div className="flex items-center justify-around h-14 px-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] transition-all duration-200 active:scale-90 ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <tab.icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-110 -translate-y-0.5" : ""}`} />
              <span className="leading-tight mt-0.5">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary animate-scale-in" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
