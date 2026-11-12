"use client";

import { useEffect } from "react";
import { recordRecentOpen } from "@/hooks/use-recent-opens";
import type { DashboardFileKind } from "@/lib/dashboard/types";

type RecordRecentOpenProps = {
  id: string;
  kind: DashboardFileKind;
  title: string;
  subtitle?: string;
  href: string;
};

export function RecordRecentOpen({
  id,
  kind,
  title,
  subtitle,
  href,
}: RecordRecentOpenProps) {
  useEffect(() => {
    recordRecentOpen({ id, kind, title, subtitle, href });
  }, [id, kind, title, subtitle, href]);

  return null;
}
