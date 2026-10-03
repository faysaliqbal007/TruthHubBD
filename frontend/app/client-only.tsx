"use client";
import dynamic from "next/dynamic";
const TruthHubApp = dynamic(() => import("./truthhub-app"), { ssr: false, loading: () => <div className="app-loading"><span/></div> });
export default function ClientOnly(){ return <TruthHubApp/>; }
