import {
  FolderOpen,
  LayoutDashboard,
  Settings,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  mobile: boolean;
};

export const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    mobile: true,
  },
  {
    title: "All Files",
    href: "/files",
    icon: FolderOpen,
    mobile: true,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    mobile: true,
  },
  {
    title: "Favorites",
    href: "/favorites",
    icon: Star,
    mobile: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    mobile: false,
  },
];

export const mobileNav = mainNav.filter((item) => item.mobile);

export function getNavItemByPath(pathname: string): NavItem | undefined {
  if (pathname === "/") {
    return mainNav.find((item) => item.href === "/");
  }

  return mainNav.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href)
  );
}

export function getPageTitle(pathname: string): string {
  return getNavItemByPath(pathname)?.title ?? "Ayesha Textile";
}
