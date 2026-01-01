import clsx from "clsx";

export const Skeleton = ({
  className,
  "aria-label": ariaLabel,
}: {
  className?: string;
  "aria-label"?: string;
}) => {
  return (
    <span
      aria-label={ariaLabel}
      className={clsx(
        "inline-block animate-pulse rounded bg-white/10",
        className,
      )}
    />
  );
};
