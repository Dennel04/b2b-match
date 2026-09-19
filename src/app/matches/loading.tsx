import { ScreenSkeleton } from "@/components/layout/ScreenSkeleton";

export default function Loading() {
  return <ScreenSkeleton active="matches" rows={5} />;
}
