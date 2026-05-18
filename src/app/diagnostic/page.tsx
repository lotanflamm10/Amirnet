"use client";
import DiagnosticTest from "@/components/diagnostic/DiagnosticTest";
import { useRouter } from "next/navigation";

export default function DiagnosticPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <DiagnosticTest onComplete={() => router.push("/app")} />
    </div>
  );
}
