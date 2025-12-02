import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, Loader2, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

export const EmployeesTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast({
          title: "Error",
          description: "You must be logged in to view employees",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('list-users', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load employees",
          variant: "destructive",
        });
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdminRole = async (userId: string, currentIsAdmin: boolean) => {
    try {
      setUpdatingUserId(userId);

      if (currentIsAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        toast({
          title: "Admin Access Revoked",
          description: "Employee no longer has admin privileges",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin',
          });

        if (error) throw error;

        toast({
          title: "Admin Access Granted",
          description: "Employee now has admin privileges",
        });
      }

      // Refresh the user list
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast({
        title: "Error",
        description: "Failed to update admin role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Employee Management
          </CardTitle>
          <CardDescription>
            Manage admin access for employees. Only admins can access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No employees found
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{user.email}</p>
                          {user.is_admin && (
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Joined {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Button
                        variant={user.is_admin ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleAdminRole(user.id, user.is_admin)}
                        disabled={updatingUserId === user.id}
                        className="gap-2"
                      >
                        {updatingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.is_admin ? (
                          <>
                            <ShieldOff className="h-4 w-4" />
                            Revoke Admin
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Grant Admin
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Only users with admin role can access the admin dashboard</p>
          <p>• New employees must first create an account at /auth</p>
          <p>• You can grant admin access to any registered employee</p>
          <p>• Be careful when revoking admin access - users will immediately lose access</p>
        </CardContent>
      </Card>
    </div>
  );
};
