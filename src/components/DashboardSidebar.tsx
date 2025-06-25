import { useState } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Home, Briefcase, Users, Building2, Plus, List, Crown, Mail, Settings, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import aimployWordmark from "/aimploy-wordmark.png";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Home,
  },
  {
    id: "job-post",
    title: "Job Post",
    icon: Briefcase,
    submenu: [
      {
        id: "create-job",
        title: "Create New Job",
        icon: Plus,
      },
      {
        id: "job-listings",
        title: "Display List of Jobs",
        icon: List,
      },
    ],
  },
  {
    id: "candidate-report",
    title: "Candidate Report", 
    icon: Users,
  },
  {
    id: "subscription",
    title: "Subscription",
    icon: Crown,
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
  },
];

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["job-post"]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  return (
    <Sidebar className="h-screen border-r">
      <SidebarContent className="h-full">
        <SidebarGroup className="h-full">
          <div className="flex items-center p-6">
            <div className="w-full flex justify-center">
              <img src={aimployWordmark} alt="AImploy" className="h-10 object-contain" />
            </div>
          </div>
          
          <SidebarGroupContent className="p-4 h-full flex-1">
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) => (
                <div key={item.id} className="group">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (item.submenu) {
                          toggleMenu(item.id);
                        } else {
                          onTabChange(item.id);
                        }
                      }}
                      className={cn(
                        "w-full justify-start text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all duration-200 rounded-xl",
                        "px-4 py-3 font-medium",
                        activeTab === item.id || (item.submenu && item.submenu.some(sub => activeTab === sub.id)) && 
                        "bg-slate-50 text-blue-600 font-semibold"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-all duration-200",
                          (activeTab === item.id || (item.submenu && item.submenu.some(sub => activeTab === sub.id))) 
                            ? "text-blue-600" 
                            : "text-slate-600 group-hover:text-blue-600"
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1">{item.title}</span>
                        {item.submenu && (
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform duration-200 text-slate-400",
                              isMenuExpanded(item.id) && "rotate-180 text-blue-600"
                            )}
                          />
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {item.submenu && (
                    <div className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isMenuExpanded(item.id) ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="ml-4 space-y-2 mt-2">
                        {item.submenu.map((subItem) => (
                          <SidebarMenuItem key={subItem.id}>
                            <SidebarMenuButton
                              onClick={() => onTabChange(subItem.id)}
                              className={cn(
                                "w-full justify-start text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 rounded-lg",
                                "px-4 py-2.5 text-sm font-medium",
                                activeTab === subItem.id && "bg-slate-50 text-slate-800 font-semibold"
                              )}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={cn(
                                  "p-1.5 rounded-md transition-all duration-200",
                                  activeTab === subItem.id 
                                    ? "text-slate-700" 
                                    : "text-slate-500 group-hover:text-slate-700"
                                )}>
                                  <subItem.icon className="w-3.5 h-3.5" />
                                </div>
                                <span>{subItem.title}</span>
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </SidebarMenu>
            
            <div className="flex-1" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
