import { customerInitials } from "@/lib/customers/initials";
import { cn } from "@/lib/utils";

type CustomerAvatarProps = {
  name: string;
  size?: "md" | "lg";
  className?: string;
};

const SIZE = {
  md: "h-12 w-12 text-[15px]",
  lg: "h-14 w-14 text-lg",
} as const;

export function CustomerAvatar({
  name,
  size = "md",
  className,
}: CustomerAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-surface-muted font-bold text-foreground",
        SIZE[size],
        className
      )}
    >
      {customerInitials(name)}
    </span>
  );
}
