import type { Metadata } from "next";
import { PlannerApp } from "@/components/planner/planner-app";

export const metadata: Metadata = {
  title: "Day Planner",
  description: "Plan your week, close each day, and move your goals forward.",
};

export default function TasksPage() {
  return <PlannerApp />;
}
