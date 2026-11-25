import { Info } from 'lucide-react';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

interface DemoNoticeProps {
  title: string;
  description: string;
  badgeText?: string;
  className?: string;
}

export function DemoNotice({
  title,
  description,
  badgeText = 'DEMO DATA',
  className,
}: DemoNoticeProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-[#F2B84B]/60 bg-[#FEF7E7]/80 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-3',
        className,
      )}
    >
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <Info className="h-4 w-4 text-[#925E08]" aria-hidden="true" />
        <Badge variant="demo">{badgeText}</Badge>
      </div>
      <div className="text-sm leading-relaxed text-[#202B3B]">
        <p className="font-semibold">{title}</p>
        <p className="text-[#526075] mt-0.5">{description}</p>
      </div>
    </div>
  );
}
