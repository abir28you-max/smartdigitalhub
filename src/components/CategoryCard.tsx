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
      className="flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-3 bg-card border-2 border-primary/30 rounded-xl md:rounded-2xl hover:border-primary/60 hover:-translate-y-1 hover:shadow-md transition-all min-w-[75px] min-h-[75px] md:min-w-[112px] md:min-h-[112px] shadow-sm"
    >
      <Icon className="h-5 w-5 md:h-7 md:w-7 text-primary" />
      <span className="text-[10px] md:text-xs font-bold text-center leading-tight">{name}</span>
    </Link>
  );
};

export default CategoryCard;
