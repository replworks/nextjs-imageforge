"use client";
import { useEffect, useState } from "react";
import { read } from "probe-pkg";
export default function P() {
  const [v, setV] = useState("pending");
  useEffect(() => setV(read()), []);
  return <p id="v">CLIENT:{v}</p>;
}
