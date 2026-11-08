import Image from "next/image";
import { imageForge } from "@replworks/nextjs-imageforge";
import { DepImage } from "fixture-dep";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge.jsx";

export function Gallery() {
  return (
    <main>
      <p id="marker">__DEVELOPER_MARKER__</p>
      <img
        id="plain"
        src="/cat.png"
        className="rounded if-w-480 if-h-320 if-crop"
        alt=""
      />
      <img id="bare" src="/cat.png" className="if-w-480" alt="" />
      <Image
        id="nimg"
        src="/cat.png"
        width={480}
        height={320}
        className="if-w-480 if-webp"
        alt=""
      />
      <Avatar src="/cat.png" className="if-w-64" />
      <Badge />
      <img id="untouched" src="/cat.png" className="rounded" alt="" />
      <img id="api" src={imageForge("/cat.png", { w: 200 })!} alt="" />
      <DepImage />
    </main>
  );
}
