import { read } from "probe-pkg";
export const dynamic = "force-dynamic";
export default function P() { return <p id="v">DYNAMIC:{read()}</p>; }
