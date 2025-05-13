
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { initialStores, type Store, type SocialLink, storeStatusColors } from "@/lib/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Instagram, Facebook, Twitter, Link as LinkIcon, Palette, User, Shield, CreditCard, Building } from "lucide-react"; // Added Building icon

const socialIconMap: Record<SocialLink["platform"], React.ElementType> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Twitter: Twitter,
  TikTok: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.47.02-4.8-.73-6.66-2.48-1.85-1.75-2.95-4.02-2.95-6.42 0-2.55 1.28-4.91 3.22-6.49L8.63 9.9c.02-.42.02-.85.02-1.28.02-2.21.02-4.41.02-6.62l2.48-.01c.01.83.01 1.66.01 2.49.01 1.07.01 2.13.01 3.2 0 .39-.03.79-.03 1.18.2-.02.4-.04.6-.05.02-.36.01-.72.02-1.08.01-1.22.01-2.43.01-3.65z"></path></svg>,
  LinkedIn: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>,
  Other: LinkIcon,
};


export default function SettingsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  // Mock user data
  const [userName, setUserName] = React.useState("Vendor Name");
  const [userEmail, setUserEmail] = React.useState("vendor@example.com");
  const [userAvatar, setUserAvatar] = React.useState("https://picsum.photos/seed/user1/100/100");
  const [newAvatarUrl, setNewAvatarUrl] = React.useState("");

  // Store settings state
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const [storeName, setStoreName] = React.useState("");
  const [storeDescription, setStoreDescription] = React.useState("");
  const [storeCategory, setStoreCategory] = React.useState("");
  const [storeLocation, setStoreLocation] = React.useState("");
  const [storeStatus, setStoreStatus] = React.useState<Store["status"]>("Inactive");
  const [storeSocialLinks, setStoreSocialLinks] = React.useState<SocialLink[]>([]);
  const [storeLogoUrl, setStoreLogoUrl] = React.useState("");
  const [newStoreLogoUrl, setNewStoreLogoUrl] = React.useState("");


  // Theme state
  const [currentTheme, setCurrentTheme] = React.useState("system");

  React.useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'system';
    setCurrentTheme(storedTheme);
    applyTheme(storedTheme, false); // Apply without toast on initial load
  }, []);
  
  React.useEffect(() => {
    if (storeId) {
      const foundStore = initialStores.find(s => s.id === storeId);
      if (foundStore) {
        setSelectedStore(foundStore);
        setStoreName(foundStore.name);
        setStoreDescription(foundStore.description);
        setStoreCategory(foundStore.category);
        setStoreLocation(foundStore.location || "");
        setStoreStatus(foundStore.status);
        setStoreSocialLinks(foundStore.socialLinks || []);
        setStoreLogoUrl(foundStore.logo);
      } else {
        setSelectedStore(null);
      }
    } else {
      setSelectedStore(null);
    }
  }, [storeId]);

  const applyTheme = (themeValue: string, showToast: boolean = true) => {
    localStorage.setItem('theme', themeValue);
    let newClassName = '';
    if (themeValue === 'system') {
      newClassName = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newClassName = themeValue;
    }
    document.documentElement.className = newClassName; // Directly set className to override
    if (showToast) {
      toast({ title: "Theme Updated", description: `Theme set to ${themeValue}.` });
    }
  };

  const handleThemeChange = (value: string) => {
    setCurrentTheme(value);
    applyTheme(value);
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAvatarUrl) setUserAvatar(newAvatarUrl);
    toast({ title: "Profile Updated", description: "Your profile information has been saved." });
  };
  
  const handleStoreSettingsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

    const updatedStoreData: Partial<Store> = {
        name: storeName,
        description: storeDescription,
        category: storeCategory,
        location: storeLocation || undefined,
        status: storeStatus,
        socialLinks: storeSocialLinks.filter(link => link.url.trim() !== ''),
        logo: newStoreLogoUrl || storeLogoUrl,
    };
    
    // Update in mock data source
    const storeIndex = initialStores.findIndex(s => s.id === selectedStore.id);
    if (storeIndex !== -1) {
        initialStores[storeIndex] = { ...initialStores[storeIndex], ...updatedStoreData } as Store;
    }
    setSelectedStore(prev => prev ? ({...prev, ...updatedStoreData} as Store) : null);

    toast({ title: "Store Settings Updated", description: `${storeName} settings have been saved.` });
  };

  const handleSocialLinkChange = (index: number, platform: SocialLink["platform"], url: string) => {
    const newLinks = [...storeSocialLinks];
    // Ensure the link object exists
    while (newLinks.length <= index) {
        // This logic might need adjustment if platforms are dynamic. For fixed platforms, this is okay.
        // For this example, we assume a fixed set of platforms or one by one addition.
        // A better way would be to have an "Add social link" button.
        // For simplicity, let's find by platform or add if not exists.
        const existingPlatformIndex = newLinks.findIndex(l => l.platform === platform);
        if(existingPlatformIndex > -1) {
             newLinks[existingPlatformIndex].url = url;
        } else {
            newLinks.push({ platform, url }); // This line will likely not be hit with current UI
        }
        setStoreSocialLinks(newLinks.filter(link => link.url.trim() !== '' || link.platform === platform)); // Keep the one being edited
        return; // exit early
    }
    
    // This part handles editing existing links based on UI structure:
    if(newLinks[index]) {
        newLinks[index] = { ...newLinks[index], url };
    } else { // If trying to edit a non-existent indexed link (should not happen with current static UI)
        newLinks[index] = { platform, url };
    }
    setStoreSocialLinks(newLinks.filter(link => link.url.trim() !== ''));
  };
  
  const getSocialUrl = (platform: SocialLink["platform"]) => storeSocialLinks.find(link => link.platform === platform)?.url || "";


  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Password Changed", description: "Your password has been successfully updated." });
    // Reset form fields if needed
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4 inline-block md:hidden lg:inline-block"/>Profile</TabsTrigger>
          <TabsTrigger value="store" disabled={!selectedStore}><Building className="mr-2 h-4 w-4 inline-block md:hidden lg:inline-block"/>Store</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-2 h-4 w-4 inline-block md:hidden lg:inline-block"/>Appearance</TabsTrigger>
          <TabsTrigger value="account"><Shield className="mr-2 h-4 w-4 inline-block md:hidden lg:inline-block"/>Account</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4 inline-block md:hidden lg:inline-block"/>Billing</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={userAvatar} alt={userName} data-ai-hint="person portrait" />
                    <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                   <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                    <Input id="avatarUrl" type="url" placeholder="https://example.com/avatar.png" value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={userName} onChange={(e) => setUserName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                </div>
                <Button type="submit">Update Profile</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Settings Tab */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
              <CardDescription>
                {selectedStore ? `Manage settings for ${selectedStore.name}.` : "Select a store from the sidebar to manage its settings."}
              </CardDescription>
            </CardHeader>
            {selectedStore && (
              <CardContent>
                <form onSubmit={handleStoreSettingsUpdate} className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32 rounded-md"> {/* Store logos often square/rectangular */}
                        <AvatarImage src={newStoreLogoUrl || storeLogoUrl} alt={storeName} data-ai-hint={selectedStore.dataAiHint || "store logo"} className="object-contain" />
                        <AvatarFallback>{storeName.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="storeLogoUrl">Store Logo URL</Label>
                        <Input id="storeLogoUrl" type="url" placeholder="https://example.com/logo.png" value={newStoreLogoUrl} onChange={e => setNewStoreLogoUrl(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="storeDescription">Description</Label>
                    <Textarea id="storeDescription" value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="storeCategory">Category</Label>
                        <Input id="storeCategory" value={storeCategory} onChange={(e) => setStoreCategory(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="storeLocation">Location</Label>
                        <Input id="storeLocation" value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} />
                    </div>
                   </div>
                   <div className="grid gap-2">
                        <Label htmlFor="storeStatus">Status</Label>
                        <Select value={storeStatus} onValueChange={(value: Store["status"]) => setStoreStatus(value)}>
                            <SelectTrigger id="storeStatus">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />
                    <h4 className="text-md font-medium">Social Links</h4>
                    {(["Instagram", "Facebook", "Twitter"] as SocialLink["platform"][]).map((platform, index) => {
                       const IconComp = socialIconMap[platform];
                       return (
                        <div key={platform} className="grid gap-2">
                            <Label htmlFor={`social${platform}`} className="flex items-center"><IconComp className="mr-2 h-4 w-4 text-muted-foreground"/> {platform} URL</Label>
                            <Input 
                                id={`social${platform}`} 
                                value={getSocialUrl(platform)} 
                                onChange={(e) => handleSocialLinkChange(index, platform, e.target.value)} // Index might not be ideal here if links are dynamic
                                placeholder={`https://${platform.toLowerCase()}.com/yourstore`}
                            />
                        </div>
                       );
                    })}
                  <Button type="submit">Update Store Settings</Button>
                </form>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Theme</Label>
                <p className="text-sm text-muted-foreground mb-3">Select your preferred color scheme.</p>
                <RadioGroup value={currentTheme} onValueChange={handleThemeChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['light', 'dark', 'system'] as const).map((themeOption) => (
                    <div key={themeOption}>
                      <RadioGroupItem value={themeOption} id={themeOption} className="peer sr-only" />
                      <Label
                        htmlFor={themeOption}
                        className={cn(
                          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                          "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        )}
                      >
                        <span className="capitalize font-medium">{themeOption}</span>
                        <div className={cn("h-16 w-full rounded-md mt-2 border flex items-center justify-center text-xs", 
                          themeOption === 'light' && 'bg-white border-slate-200 text-slate-800',
                          themeOption === 'dark' && 'bg-slate-900 border-slate-700 text-slate-100',
                          themeOption === 'system' && 'bg-gradient-to-br from-white via-slate-200 to-slate-900 border-slate-400 text-slate-600'
                        )}>
                           {themeOption === 'light' ? 'Light Mode' : themeOption === 'dark' ? 'Dark Mode' : 'System Default'}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button type="submit">Change Password</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      Receive important updates and alerts via email.
                    </span>
                  </Label>
                  <Switch id="emailNotifications" defaultChecked onCheckedChange={(checked) => toast({title: `Email notifications ${checked ? 'enabled' : 'disabled'}`})}/>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="lowStockAlerts" className="flex flex-col space-y-1">
                    <span>Low Stock Alerts</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      Get notified when product stock is running low.
                    </span>
                  </Label>
                  <Switch id="lowStockAlerts" onCheckedChange={(checked) => toast({title: `Low stock alerts ${checked ? 'enabled' : 'disabled'}`})}/>
                </div>
                <Separator />
                 <div className="flex items-center justify-between">
                  <Label htmlFor="newOrderAlerts" className="flex flex-col space-y-1">
                    <span>New Order Alerts</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      Receive a notification for every new order.
                    </span>
                  </Label>
                  <Switch id="newOrderAlerts" defaultChecked onCheckedChange={(checked) => toast({title: `New order alerts ${checked ? 'enabled' : 'disabled'}`})}/>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Manage your subscription and payment methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Current Plan</h3>
                <p className="text-muted-foreground">Pro Plan ($49/month)</p>
              </div>
              <div>
                <h3 className="font-medium">Payment Method</h3>
                <p className="text-muted-foreground">Visa ending in **** 1234</p>
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline">Manage Subscription</Button>
                <Button variant="outline">View Invoices</Button>
              </div>
               <p className="text-xs text-muted-foreground pt-4">
                For any billing inquiries, please contact support. This is a placeholder section.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
