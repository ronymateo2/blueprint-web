import {
  ForkKnifeIcon,
  DropIcon,
  CoffeeIcon,
  PillIcon,
  BookIcon,
  PersonSimpleRunIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
  StarIcon,
  LeafIcon,
  LightningIcon,
  ClockIcon,
  TargetIcon,
  BarbellIcon,
  BellIcon,
  HeartIcon,
  MusicNoteIcon,
  PhoneIcon,
  PlusIcon,
  CheckIcon,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

const ICONS: Record<string, Icon> = {
  dish:   ForkKnifeIcon,
  water:  DropIcon,
  mug:    CoffeeIcon,
  pill:   PillIcon,
  book:   BookIcon,
  run:    PersonSimpleRunIcon,
  dumb:   BarbellIcon,
  sun:    SunIcon,
  moon:   MoonIcon,
  fire:   FireIcon,
  star:   StarIcon,
  leaf:   LeafIcon,
  bolt:   LightningIcon,
  clock:  ClockIcon,
  target: TargetIcon,
  bell:   BellIcon,
  heart:  HeartIcon,
  music:  MusicNoteIcon,
  phone:  PhoneIcon,
  plus:   PlusIcon,
  check:  CheckIcon,
};

interface HandIconProps {
  kind: string;
  size?: number;
  color?: string;
}

export function HandIcon({ kind, size = 22, color = 'var(--ink)' }: HandIconProps) {
  const IconComponent = ICONS[kind] ?? StarIcon;
  return <IconComponent size={size} color={color} weight="regular" />;
}
