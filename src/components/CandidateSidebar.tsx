import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  Settings, 
  Sparkles, 
  LogOut,
  ChevronDown,
  FileText,
  Send,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCandidate } from "@/hooks/useCandidate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "@/../public/aimploy-wordmark.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { name: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { name: "My Profile", href: "/candidate/profile", icon: User },
  { name: "My Applications", href: "/candidate/applications", icon: Briefcase },
];

// Add NavLinkProps type
interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  currentPath: string;
}

const NavLink = ({ to, icon: Icon, children, currentPath }: NavLinkProps) => (
    <Link to={to} className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
        ${currentPath === to ? 'bg-blue-100 text-blue-900 font-semibold shadow' : 'text-blue-900 hover:bg-blue-50 hover:text-blue-700'}`}>
        <Icon className="w-5 h-5 mr-3" />
        {children}
    </Link>
);

export const CandidateSidebar = ({ open, setOpen }: { open?: boolean, setOpen?: (open: boolean) => void }) => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const { profile } = useCandidate();
    const isMobile = useIsMobile();

    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('');
    }

    const sidebarContent = (
      <div className="flex flex-col w-64 bg-white/90 text-blue-900 h-full border-r border-blue-100">
        <div className="flex items-center h-20 px-6 border-b border-blue-100">
          <img src={Logo} alt="AImploy Logo" className="h-10 w-auto" />
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavLink to="/candidate" icon={LayoutDashboard} currentPath={location.pathname}>Dashboard</NavLink>
          <NavLink to="/candidate/applications" icon={FileText} currentPath={location.pathname}>My Applications</NavLink>
          <NavLink to="/candidate/submit" icon={Send} currentPath={location.pathname}>Submit & Track</NavLink>
          <NavLink to="/candidate/settings" icon={Settings} currentPath={location.pathname}>Settings</NavLink>
        </nav>
        <div className="p-4 border-t border-gray-700/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-left h-auto p-2 hover:bg-gray-700/50">
                <div className="flex items-center w-full">
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-green-600 text-white font-bold">
                      {profile?.full_name ? getInitials(profile.full_name) : 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white truncate">{profile?.full_name || "Candidate"}</p>
                    <p className="text-xs text-gray-400">Independent</p>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { /* navigate to settings */ }}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <>
          <Sheet open={!!open} onOpenChange={setOpen}>
            <SheetContent side="left" className="p-0 w-64">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </>
      );
    }

    return (
      <div className="flex flex-col w-64 bg-white/90 text-blue-900 h-screen fixed top-0 left-0 border-r border-blue-100">
        {sidebarContent}
      </div>
    );
} 