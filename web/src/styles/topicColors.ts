import type { BadgeProps } from '../components/ui/Badge';

export type TopicColorVariant = NonNullable<BadgeProps['variant']>;

export interface TopicVisualStyle {
  badgeVariant: TopicColorVariant;
  accentBarClass: string;
  dotClass: string;
}

const TOPIC_STYLES: Record<string, TopicVisualStyle> = {
  'arrays & hash map': {
    badgeVariant: 'blue',
    accentBarClass: 'bg-[#397BDB]',
    dotClass: 'bg-[#397BDB]',
  },
  'hashing & frequency': {
    badgeVariant: 'blue',
    accentBarClass: 'bg-[#397BDB]',
    dotClass: 'bg-[#397BDB]',
  },
  'stack (lifo)': {
    badgeVariant: 'teal',
    accentBarClass: 'bg-[#15A897]',
    dotClass: 'bg-[#15A897]',
  },
  'graphs & bfs': {
    badgeVariant: 'teal',
    accentBarClass: 'bg-[#15A897]',
    dotClass: 'bg-[#15A897]',
  },
  'binary search + greedy': {
    badgeVariant: 'amber',
    accentBarClass: 'bg-[#F2B84B]',
    dotClass: 'bg-[#F2B84B]',
  },
  'binary search': {
    badgeVariant: 'amber',
    accentBarClass: 'bg-[#F2B84B]',
    dotClass: 'bg-[#F2B84B]',
  },
  'two pointers': {
    badgeVariant: 'sky',
    accentBarClass: 'bg-[#83C8ED]',
    dotClass: 'bg-[#83C8ED]',
  },
  'sliding window': {
    badgeVariant: 'green',
    accentBarClass: 'bg-[#74BF88]',
    dotClass: 'bg-[#74BF88]',
  },
  'dynamic programming': {
    badgeVariant: 'coral',
    accentBarClass: 'bg-[#F47768]',
    dotClass: 'bg-[#F47768]',
  },
};

const DEFAULT_TOPIC_STYLE: TopicVisualStyle = {
  badgeVariant: 'blue',
  accentBarClass: 'bg-[#397BDB]',
  dotClass: 'bg-[#397BDB]',
};

/**
 * Maps algorithm topics to distinct, consistent Colorful Minimalism tokens.
 */
export function getTopicVisualStyle(topic: string): TopicVisualStyle {
  const key = topic.trim().toLowerCase();
  return TOPIC_STYLES[key] ?? DEFAULT_TOPIC_STYLE;
}
