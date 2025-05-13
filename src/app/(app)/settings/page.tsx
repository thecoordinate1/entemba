
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import NextImage from "next/image"; // Renamed to avoid conflict
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
import { initialStores, type Store, type SocialLink } from "@/lib/mockData"; // Removed storeStatusColors as it's not used here
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Instagram, Facebook, Twitter, Link as LinkIcon, Palette, User, Shield, CreditCard, Building, UploadCloud } from "lucide-react";

const socialIconMap: Record<SocialLink["platform"], React.ElementType> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Twitter: Twitter,
  TikTok: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.47.02-4.8-.73-6.66-2.48-1.85-1.75-2.95-4.02-2.95-6.42 0-2.55 1.28-4.91 3.22-6.49L8.63 9.9c.02-.42.02-.85.02-1.28.02-2.21.02-4.41.02-6.62l2.48-.01c.01.83.01 1.66.01 2.49.01 1.07.01 2.13.01 3.2 0 .39-.03.79-.03 1.18.2-.02.4-.04.6-.05.02-.36.01-.72.02-1.08.01-1.22.01-2.43.01-3.65z"></path></svg>,
  LinkedIn: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>,
  Other: LinkIcon,
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function SettingsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get("storeId"); // Renamed to avoid conflict

  // Mock user data
  const [userName, setUserName] = React.useState("Vendor Name");
  const [userEmail, setUserEmail] = React.useState("vendor@example.com");
  const [userAvatar, setUserAvatar] = React.useState("https://picsum.photos/seed/user1/100/100"); // Stores final data URI or URL
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(userAvatar);


  // Store settings state
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const [storeName, setStoreName] = React.useState("");
  const [storeDescription, setStoreDescription] = React.useState("");
  const [storeCategory, setStoreCategory] = React.useState("");
  const [storeLocation, setStoreLocation] = React.useState("");
  const [storeStatus, setStoreStatus] = React.useState<Store["status"]>("Inactive");
  const [storeSocialLinks, setStoreSocialLinks] = React.useState<SocialLink[]>([]);
  
  const [storeLogo, setStoreLogo] = React.useState<string>(""); // Stores final data URI or URL for logo
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [storeDataAiHint, setStoreDataAiHint] = React.useState<string>("");


  // Theme state
  const [currentTheme, setCurrentTheme] = React.useState("system");

  React.useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'system';
    setCurrentTheme(storedTheme);
    applyTheme(storedTheme, false); 
  }, []);
  
  React.useEffect(() => {
    if (storeIdFromUrl) {
      const foundStore = initialStores.find(s => s.id === storeIdFromUrl);
      if (foundStore) {
        setSelectedStore(foundStore);
        setStoreName(foundStore.name);
        setStoreDescription(foundStore.description);
        setStoreCategory(foundStore.category);
        setStoreLocation(foundStore.location || "");
        setStoreStatus(foundStore.status);
        setStoreSocialLinks(foundStore.socialLinks || []);
        setStoreLogo(foundStore.logo);
        setLogoPreview(foundStore.logo);
        setStoreDataAiHint(foundStore.dataAiHint || "store logo");
      } else {
        setSelectedStore(null);
      }
    } else {
      setSelectedStore(null);
    }
  }, [storeIdFromUrl]);

  const applyTheme = (themeValue: string, showToast: boolean = true) => {
    localStorage.setItem('theme', themeValue);
    let newClassName = '';
    if (themeValue === 'system') {
      newClassName = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newClassName = themeValue;
    }
    document.documentElement.className = newClassName;
    if (showToast) {
      toast({ title: "Theme Updated", description: `Theme set to ${themeValue}.` });
    }
  };

  const handleThemeChange = (value: string) => {
    setCurrentTheme(value);
    applyTheme(value);
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      if (avatarPreview && avatarFile) URL.revokeObjectURL(avatarPreview); // Revoke old object URL
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarFile(null);
      if (avatarPreview && avatarFile) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(userAvatar); // Revert to original/saved avatar
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalAvatar = userAvatar;
    if (avatarFile) {
      try {
        finalAvatar = await fileToDataUri(avatarFile);
        setUserAvatar(finalAvatar);
        if (avatarPreview && avatarFile) URL.revokeObjectURL(avatarPreview); // Clean up object URL
        setAvatarPreview(finalAvatar); // Show the new data URI
        setAvatarFile(null); // Reset file input state
      } catch (error) {
        toast({ variant: "destructive", title: "Avatar Upload Failed", description: "Could not process the image." });
        return;
      }
    }
    // Update name, email etc.
    toast({ title: "Profile Updated", description: "Your profile information has been saved." });
  };
  
  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      if (logoPreview && logoFile) URL.revokeObjectURL(logoPreview);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      if (logoPreview && logoFile) URL.revokeObjectURL(logoPreview);
      setLogoPreview(storeLogo); 
    }
  };

  const handleStoreSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

    let finalLogo = storeLogo;
    if (logoFile) {
        try {
            finalLogo = await fileToDataUri(logoFile);
            if (logoPreview && logoFile) URL.revokeObjectURL(logoPreview);
            setLogoPreview(finalLogo);
            setLogoFile(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Logo Upload Failed", description: "Could not process the logo image." });
            return;
        }
    }

    const updatedStoreData: Partial<Store> = {
        name: storeName,
        description: storeDescription,
        category: storeCategory,
        location: storeLocation || undefined,
        status: storeStatus,
        socialLinks: storeSocialLinks.filter(link => link.url.trim() !== ''),
        logo: finalLogo,
        dataAiHint: storeDataAiHint,
    };
    
    const storeIndex = initialStores.findIndex(s => s.id === selectedStore.id);
    if (storeIndex !== -1) {
        initialStores[storeIndex] = { ...initialStores[storeIndex], ...updatedStoreData } as Store;
    }
    setSelectedStore(prev => prev ? ({...prev, ...updatedStoreData} as Store) : null);
    setStoreLogo(finalLogo); // Update the main logo state as well

    toast({ title: "Store Settings Updated", description: `${storeName} settings have been saved.` });
  };

  const handleSocialLinkChange = (index: number, platform: SocialLink["platform"], url: string) => {
    const newLinks = [...storeSocialLinks];
    const existingLinkIndex = newLinks.findIndex(link => link.platform === platform);

    if (url.trim() === "") { // If URL is empty, remove the link if it exists
        if (existingLinkIndex > -1) {
            newLinks.splice(existingLinkIndex, 1);
        }
    } else { // If URL is not empty
        if (existingLinkIndex > -1) { // Update existing link
            newLinks[existingLinkIndex].url = url;
        } else { // Add new link if it doesn't exist
             // This path is less likely with the current fixed UI, but good for robustness
             // For fixed inputs, usually only existing links are modified or created if empty initially.
             // Let's ensure we target the correct one via index if it's for a pre-defined slot.
            if(newLinks[index] && newLinks[index].platform === platform) {
                 newLinks[index].url = url;
            } else {
                 // This case handles if we're adding a new platform not initially in the array,
                 // or if the index mapping is complex. For this UI, direct indexing is simpler.
                 // Let's assume the UI provides a fixed set of platform inputs.
                 // We find or create the specific platform.
                 let targetLink = newLinks.find(l => l.platform === platform);
                 if(targetLink) targetLink.url = url;
                 else newLinks.push({ platform, url });
            }
        }
    }
    setStoreSocialLinks(newLinks);
  };
  
  const getSocialUrl = (platform: SocialLink["platform"]) => storeSocialLinks.find(link => link.platform === platform)?.url || "";


  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Password Changed", description: "Your password has been successfully updated." });
    (e.target as HTMLFormElement).reset();
  };

  React.useEffect(() => {
    return () => { // Cleanup object URLs on unmount
      if (avatarPreview && avatarFile) URL.revokeObjectURL(avatarPreview);
      if (logoPreview && logoFile) URL.revokeObjectURL(logoPreview);
    };
  }, [avatarPreview, avatarFile, logoPreview, logoFile]);


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
                    <AvatarImage src={avatarPreview || undefined} alt={userName} data-ai-hint="person portrait" />
                    <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                   <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="avatarFile">Upload Avatar</Label>
                    <Input id="avatarFile" type="file" accept="image/*" onChange={handleAvatarFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
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
                     {logoPreview ? (
                        <NextImage src={logoPreview} alt={`${storeName} logo preview`} width={128} height={128} className="rounded-md object-contain h-32 w-32 border" data-ai-hint={storeDataAiHint || "store logo"} />
                      ) : (
                        <div className="h-32 w-32 rounded-md border bg-muted flex items-center justify-center">
                          <UploadCloud className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="storeLogoFile">Upload Store Logo</Label>
                        <Input id="storeLogoFile" type="file" accept="image/*" onChange={handleLogoFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"/>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="storeDataAiHint">Logo AI Hint</Label>
                        <Input id="storeDataAiHint" value={storeDataAiHint} onChange={(e) => setStoreDataAiHint(e.target.value)} placeholder="e.g. 'modern shop'"/>
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
                    {(["Instagram", "Facebook", "Twitter"] as const).map((platform, index) => {
                       const IconComp = socialIconMap[platform];
                       return (
                        <div key={platform} className="grid gap-2">
                            <Label htmlFor={`social${platform}`} className="flex items-center"><IconComp className="mr-2 h-4 w-4 text-muted-foreground"/> {platform} URL</Label>
                            <Input 
                                id={`social${platform}`} 
                                value={getSocialUrl(platform)} 
                                onChange={(e) => handleSocialLinkChange(index, platform, e.target.value)}
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
