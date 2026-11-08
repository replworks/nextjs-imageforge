export function Avatar({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <span data-avatar="">
      <img id="avatar" src={src} className={className} alt="" />
    </span>
  );
}
