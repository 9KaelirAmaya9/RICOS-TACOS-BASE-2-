import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, Palette, FileText, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoBranded from "@/assets/logo-branded.png";

export default function Settings() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [branding, setBranding] = useState({
    company_name: 'Axonic Motorworks',
    tagline: 'Veteran-Owned Auto Body & Paint Excellence',
    location: 'Austin, Texas',
    address: '15600 Marsha Street, Building 1 Unit 1A, Austin, TX',
    phone: '210-823-1595',
    email: 'sales@axonicmoto.com',
    website: 'www.axonicmoto.com',
    primary_color: '#1a365d',
    secondary_color: '#718096',
    accent_color: '#ef4444'
  });

  useEffect(() => {
    checkAdminStatus();
    loadBrandingSettings();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!roles || roles.role !== "admin") {
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadBrandingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("branding_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setBranding({
          company_name: data.company_name,
          tagline: data.tagline,
          location: data.location,
          address: data.address,
          phone: data.phone,
          email: data.email,
          website: data.website,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
        });
      }
    } catch (error: any) {
      console.error("Error loading branding:", error);
    }
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("branding_settings")
        .update({
          company_name: branding.company_name,
          tagline: branding.tagline,
          location: branding.location,
          address: branding.address,
          phone: branding.phone,
          email: branding.email,
          website: branding.website,
          primary_color: branding.primary_color,
          secondary_color: branding.secondary_color,
          accent_color: branding.accent_color,
        })
        .eq("id", (await supabase.from("branding_settings").select("id").single()).data?.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Branding settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      // Preview disabled for now - removed BrandedPDFGenerator class
      toast({
        title: "Preview Unavailable",
        description: "PDF preview has been temporarily disabled during system upgrade.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Settings</h1>
          </div>

          <Tabs defaultValue="branding" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company Info
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDF Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Colors & Logo</CardTitle>
                  <CardDescription>
                    Customize the colors used in all PDF documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <img src={logoBranded} alt="Company Logo" className="h-24 w-24 object-contain" />
                    </div>
                    <div className="flex-1">
                      <Label>Company Logo</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Current logo is displayed in all PDF headers
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        To change the logo, replace the file at: src/assets/logo-branded.png
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={branding.primary_color}
                          onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={branding.primary_color}
                          onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                          placeholder="#1a365d"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Headers & accents</p>
                    </div>

                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={branding.secondary_color}
                          onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={branding.secondary_color}
                          onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                          placeholder="#718096"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Section headers</p>
                    </div>

                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="accentColor"
                          type="color"
                          value={branding.accent_color}
                          onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={branding.accent_color}
                          onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                          placeholder="#ef4444"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Highlights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    This information appears in PDF headers and footers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={branding.company_name}
                        onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
                        placeholder="Axonic Motorworks"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={branding.location}
                        onChange={(e) => setBranding({ ...branding, location: e.target.value })}
                        placeholder="Austin, Texas"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={branding.tagline}
                      onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                      placeholder="Veteran-Owned Auto Body & Paint Excellence"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Full Address</Label>
                    <Input
                      id="address"
                      value={branding.address}
                      onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                      placeholder="15600 Marsha Street, Building 1 Unit 1A, Austin, TX"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={branding.phone}
                        onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                        placeholder="210-823-1595"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={branding.email}
                        onChange={(e) => setBranding({ ...branding, email: e.target.value })}
                        placeholder="sales@axonicmoto.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={branding.website}
                        onChange={(e) => setBranding({ ...branding, website: e.target.value })}
                        placeholder="www.axonicmoto.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>PDF Template Preview</CardTitle>
                  <CardDescription>
                    Generate a sample PDF to see how your branding looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg">
                    <div className="text-center space-y-4">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-lg">Preview Your PDF Template</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click the button below to generate a sample PDF with your current settings
                        </p>
                      </div>
                      <Button onClick={handlePreviewPDF} size="lg">
                        Generate Preview PDF
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Note:</strong> The preview PDF includes:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Company logo and branding</li>
                      <li>Professional header with your company information</li>
                      <li>Sample sections showing layout and styling</li>
                      <li>Footer with contact details</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Cancel
            </Button>
            <Button onClick={handleSaveBranding} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
