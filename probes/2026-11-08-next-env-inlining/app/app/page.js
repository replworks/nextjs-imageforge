import { read } from "probe-pkg";
export default function P() { return <p id="v">SERVER:{read()}|other={process.env.OTHER}</p>; }
