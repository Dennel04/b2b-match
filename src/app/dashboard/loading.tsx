import { ScreenSkeleton } from "@/components/layout/ScreenSkeleton";

export default function Loading() {
  return <ScreenSkeleton active="dashboard" rows={4} />;
}
