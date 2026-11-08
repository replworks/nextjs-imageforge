"use client";
import Image from "next/image";
import { useState } from "react";
export default function P() {
  const [n] = useState(1);
  return <main data-n={n}><img id="cplain" src="/cat.png" className="if-w-320" alt="" /><Image id="cimg" src="/cat.png" width={320} height={200} className="if-w-320" alt="" /></main>;
}
