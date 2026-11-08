import Image from "next/image";
import { Avatar } from "../components/Avatar";
export default function P() {
  return (
    <main>
      <img id="plain" src="/cat.png" className="rounded if-w-480" alt="" />
      <Image id="nimg" src="/cat.png" width={480} height={320} className="if-w-480 if-webp" alt="" />
      <Avatar src="/cat.png" className="if-w-64" />
      <img id="untouched" src="/cat.png" className="rounded" alt="" />
    </main>
  );
}
