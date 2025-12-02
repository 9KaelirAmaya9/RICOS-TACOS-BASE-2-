import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { ClientsTab } from "@/components/admin/ClientsTab";
import { EmployeesTab } from "@/components/admin/EmployeesTab";
import { WorkOrdersTab } from "@/components/admin/WorkOrdersTab";
import { Shield, FileText, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateWorkOrderDialog } from "@/components/admin/CreateWorkOrderDialog";

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createWorkOrderOpen, setCreateWorkOrderOpen] = useState(false);
  const [refreshWorkOrders, setRefreshWorkOrders] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      setLoading(false);
      navigate("/auth");
      return;
    }

    const currentUser = data.user;
    setUser(currentUser);

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Error checking admin role", roleError);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(roleData?.role === "admin");
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navigation />
      <main className="flex-1 flex flex-col overflow-hidden pt-24">
        <div className="flex-1 flex flex-col px-6 py-6 max-w-screen-2xl mx-auto w-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <Button variant="outline" onClick={() => navigate("/settings")}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          <Tabs defaultValue="work-orders" className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4 flex-shrink-0 gap-4">
              <TabsList className="grid w-full max-w-3xl grid-cols-4">
                <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
                <TabsTrigger value="orders">Old Orders</TabsTrigger>
                <TabsTrigger value="clients">Clients</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
              </TabsList>
              <Button onClick={() => setCreateWorkOrderOpen(true)} className="flex-shrink-0">
                <FileText className="h-4 w-4 mr-2" />
                New Work Order
              </Button>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto">
              <TabsContent value="work-orders" className="h-full mt-0">
                <WorkOrdersTab key={refreshWorkOrders} />
              </TabsContent>
              
              <TabsContent value="orders" className="h-full mt-0">
                <OrdersTab />
              </TabsContent>
              
              <TabsContent value="clients" className="h-full mt-0">
                <ClientsTab />
              </TabsContent>
              
              <TabsContent value="employees" className="h-full mt-0">
                <EmployeesTab />
              </TabsContent>
            </div>
          </Tabs>

          <CreateWorkOrderDialog
            open={createWorkOrderOpen}
            onOpenChange={setCreateWorkOrderOpen}
            onSuccess={() => setRefreshWorkOrders((prev) => prev + 1)}
          />
        </div>
      </main>
    </div>
  );
};

export default Admin;
