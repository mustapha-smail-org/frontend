import type { Metadata } from "next";
import { AdminFeedback } from "@/components/AdminFeedback";

export const metadata: Metadata = {
  title: "Retours reçus",
  robots: { index: false, follow: false },
};

export default function AdminFeedbackPage() {
  return <AdminFeedback />;
}
