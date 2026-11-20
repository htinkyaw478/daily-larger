import {
  Briefcase,
  Car,
  Heart,
  Home,
  Laptop,
  PlusCircle,
  Receipt,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  Utensils,
} from 'lucide-react';

export function CategoryIcon({
  name,
  size = 16,
}: {
  name: string;
  size?: number;
}) {
  switch (name) {
    case 'briefcase':
      return <Briefcase size={size} aria-hidden="true" />;
    case 'store':
      return <Store size={size} aria-hidden="true" />;
    case 'laptop':
      return <Laptop size={size} aria-hidden="true" />;
    case 'trending-up':
      return <TrendingUp size={size} aria-hidden="true" />;
    case 'plus-circle':
      return <PlusCircle size={size} aria-hidden="true" />;
    case 'utensils':
      return <Utensils size={size} aria-hidden="true" />;
    case 'car':
      return <Car size={size} aria-hidden="true" />;
    case 'receipt':
      return <Receipt size={size} aria-hidden="true" />;
    case 'shopping-bag':
      return <ShoppingBag size={size} aria-hidden="true" />;
    case 'heart':
      return <Heart size={size} aria-hidden="true" />;
    case 'home':
      return <Home size={size} aria-hidden="true" />;
    default:
      return <Tag size={size} aria-hidden="true" />;
  }
}
