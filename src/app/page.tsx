import type { Metadata } from "next";
import { SetupForm } from "@/features/game/ui/setup-form";
import { strings } from "@/features/game/ui/strings";

export const metadata: Metadata = {
  title: strings.metadata.homeTitle,
};

export default function HomePage() {
  return <SetupForm />;
}
