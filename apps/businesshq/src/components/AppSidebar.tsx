import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  FolderLock,
  BadgeCheck,
  ShieldCheck,
  Users,
  Banknote,
  Wallet,
  KanbanSquare,
  Boxes,
  FileSignature,
  HandCoins,
  Sparkles,
  FileBarChart,
  Settings,
  ShieldAlert,
  Wand2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const sections: { label: string; items: { title: string; url: string; icon: any }[] }[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "AI Advisor", url: "/ai-advisor", icon: Sparkles },
    ],
  },
  {
    label: "Company",
    items: [
      { title: "Setup Wizard", url: "/setup", icon: Wand2 },
      { title: "Company Profile", url: "/company", icon: Building2 },
      { title: "Documents", url: "/documents", icon: FolderLock },
      { title: "Licenses", url: "/licenses", icon: BadgeCheck },
      { title: "Compliance", url: "/compliance", icon: ShieldCheck },
      { title: "Contracts", url: "/contracts", icon: FileSignature },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Staff", url: "/staff", icon: Users },
      { title: "Payroll", url: "/payroll", icon: Banknote },
      { title: "Finance", url: "/finance", icon: Wallet },
      { title: "Projects", url: "/projects", icon: KanbanSquare },
      { title: "Assets", url: "/assets", icon: Boxes },
      { title: "Grants", url: "/grants", icon: HandCoins },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/reports", icon: FileBarChart },
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Admin Panel", url: "/admin", icon: ShieldAlert },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div
            className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-primary-foreground font-bold"
            style={{ background: "var(--gradient-primary)" }}
          >
            B
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">BusinessHQ</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Malaysia</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((sec) => (
          <SidebarGroup key={sec.label}>
            {!collapsed && <SidebarGroupLabel>{sec.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {sec.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-3 py-3 text-[10px] text-muted-foreground">
        {!collapsed && <span>v0.1 · Multi-tenant SaaS</span>}
      </SidebarFooter>
    </Sidebar>
  );
}
