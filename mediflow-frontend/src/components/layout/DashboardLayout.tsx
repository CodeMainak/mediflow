import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "../ui/sidebar";
import {
  Stethoscope,
  Users,
  Calendar,
  Settings,
  LogOut,
  UserPlus,
  Pill,
  HeartHandshake,
  Activity,
  User,
  MessageSquare,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const { user, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  const getNavItems = () => {
    const baseItems = [{ id: "dashboard", label: "Dashboard", icon: Activity }];

    const role = user?.role?.toLowerCase();

    switch (role) {
      case "doctor":
        return [
          ...baseItems,
          { id: "patients", label: "My Patients", icon: HeartHandshake },
          { id: "appointments", label: "Appointments", icon: Calendar },
          { id: "prescriptions", label: "Prescriptions", icon: Pill },
          { id: "messages", label: "Messages", icon: MessageSquare },
        ];
      case "patient":
        return [
          ...baseItems,
          { id: "appointments", label: "My Appointments", icon: Calendar },
          { id: "prescriptions", label: "My Prescriptions", icon: Pill },
          { id: "messages", label: "Messages", icon: MessageSquare },
          { id: "profile", label: "My Profile", icon: User },
        ];
      case "receptionist":
      case "admin":
        return [
          ...baseItems,
          { id: "patients", label: "All Patients", icon: Users },
          { id: "appointments", label: "All Appointments", icon: Calendar },
          { id: "add-patient", label: "Add Patient", icon: UserPlus },
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  const getRoleColor = (role: string) => {
    switch (role) {
      case "doctor":
        return "bg-green-100 text-green-800";
      case "patient":
        return "bg-blue-100 text-blue-800";
      case "receptionist":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          {/* BRAND HEADER */}
          <SidebarHeader className="p-4 bg-gradient-to-r from-green-600 to-emerald-500 rounded-b-2xl shadow-md">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg shadow-md relative">
                <Stethoscope className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">MediFlow</h2>
                <p className="text-xs text-emerald-100">Doctor’s Hub</p>
              </div>
            </div>
          </SidebarHeader>

          {/* NAVIGATION */}
          <SidebarContent className="p-4">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start transition-all duration-200 ${isActive
                      ? "bg-green-100 text-green-800 font-semibold shadow-sm"
                      : "hover:bg-green-50"
                      }`}
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </SidebarContent>

          {/* USER FOOTER */}
          <SidebarFooter className="p-4 border-t bg-gray-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-2 hover:bg-green-50 rounded-xl"
                >
                  <Avatar className="h-10 w-10 mr-2 ring-2 ring-green-500">
                    <AvatarFallback>
                      {user?.name.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold">{user?.name}</div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getRoleColor(user?.role || "")}`}
                    >
                      {user?.role}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onTabChange('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)}>
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-red-600">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* HEADER */}
          <header className="border-b bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-green-700">
                  {navItems.find((item) => item.id === activeTab)?.label ||
                    "Dashboard"}
                </h1>
              </div>

              {/* NOTIFICATION BELL & LOGOUT */}
              <div className="flex items-center space-x-2">
                <NotificationDropdown />

                {/* User Info & Logout */}
                <div className="hidden md:flex items-center space-x-2 border-l pl-3 ml-2">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getRoleColor(user?.role || "")}`}
                    >
                      {user?.role}
                    </Badge>
                  </div>
                  <Avatar className="h-9 w-9 ring-2 ring-green-500">
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-sm">
                      {user?.name.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogoutDialogOpen(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center text-lg">
              <LogOut className="mr-2 h-5 w-5 text-red-600" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>

          {/* <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border my-2">
            <Avatar className="h-10 w-10 ring-2 ring-green-500">
              <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-sm">
                {user?.name.split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user?.name}</p>
              <Badge
                variant="secondary"
                className={`text-xs ${getRoleColor(user?.role || "")}`}
              >
                {user?.role}
              </Badge>
            </div>
          </div> */}

          <div className="flex flex-col gap-3 pt-4 ">
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              size="lg"
              className="w-full text-green-700 bg-red-600 hover:bg-red-700 font-bold shadow-md hover:shadow-lg transition-all text-base mb-2"
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span className="text-green-700 font-bold ">Logout</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setLogoutDialogOpen(false)}
              className="w-full border-gray-300 hover:bg-gray-100 font-semibold text-gray-700"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};
