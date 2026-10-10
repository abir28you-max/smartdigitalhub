import { Link } from "react-router-dom";
import { Bot, Pen, Shield, BookOpen, Gamepad2, CreditCard, Monitor, Share2, Tv, Code, LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  bot: Bot,
  pen: Pen,
  shield: Shield,
  book: BookOpen,
  gamepad: Gamepad2,
  creditcard: CreditCard,
  monitor: Monitor,
  share: Share2,
  tv: Tv,
  code: Code,
};

interface CategoryCardProps {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
}

const CategoryCard = ({ slug, name, icon }: CategoryCardProps) => {
  const normalizedIcon = icon?.toLowerCase() || "";
  const Icon = normalizedIcon ? iconMap[normalizedIcon] || Bot : Bot;

  return (
    <Link
      to={`/category/${slug}`}
      className="group flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2.5 md:p-3.5 bg-card border-2 border-primary/25 rounded-xl md:rounded-2xl hover:border-primary/70 hover:-translate-y-1.5 hover:shadow-lg transition-[transform,box-shadow,border-color] duration-250 ease-out min-w-[78px] min-h-[78px] md:min-w-[112px] md:min-h-[112px] shadow-xs active:scale-95 gpu-smooth select-none"
    >
      <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary animate-icon-wiggle" />
      </div>
      <span className="text-[10px] md:text-xs font-bold text-center leading-tight text-foreground group-hover:text-primary transition-colors">{name}</span>
    </Link>
  );
};

export default CategoryCard;
