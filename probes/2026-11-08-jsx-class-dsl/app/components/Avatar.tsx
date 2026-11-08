export function Avatar({ src, className }: { src: string; className?: string }) {
  return <span data-avatar><img src={src} className={className} alt="" /></span>;
}
