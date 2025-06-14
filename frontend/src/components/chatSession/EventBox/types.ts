import type { EventModel } from '@/types/event';

export interface BaseEventBoxProps {
  event: EventModel;
  className?: string;
}

export interface TabProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
