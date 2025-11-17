

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NextImage from "next/image";
import type { User as AuthUser } from '@supabase/supabase-js';

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
import type { SocialLink as MockSocialLinkType } from "@/lib/mockData"; // Using MockStoreType for status temporarily
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Instagram, Facebook, Twitter, Link as LinkIcon, Palette, User, Shield, CreditCard, Building, UploadCloud, LocateFixed, Copy, Banknote, Phone, Pencil, Eye, EyeOff } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getCurrentVendorProfile, updateCurrentVendorProfile, uploadAvatar, type VendorProfile, type VendorProfileUpdatePayload } from "@/services/userService";
import { getStoreById, updateStore, type StoreFromSupabase, type SocialLinkPayload, type StorePayload } from "@/services/storeService";
import { Skeleton } from "@/components/ui/skeleton";

const socialIconMap: Record<string, React.ElementType> = {
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
  const router = useRouter();
  const storeIdFromUrl = searchParams.get("storeId");
  const supabase = createClient();

  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [isLoadingStore, setIsLoadingStore] = React.useState(false);
  const [isUpdatingPayout, setIsUpdatingPayout] = React.useState(false);

  // User profile state
  const [userName, setUserName] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null); 
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null); 

  // Payout state
  const [bankName, setBankName] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [branchName, setBranchName] = React.useState('');
  const [momoProvider, setMomoProvider] = React.useState('');
  const [momoNumber, setMomoNumber] = React.useState('');
  const [momoName, setMomoName] = React.useState('');

  // Store settings state
  const [selectedStore, setSelectedStore] = React.useState<StoreFromSupabase | null>(null);
  const [storeName, setStoreName] = React.useState("");
  const [storeDescription, setStoreDescription] = React.useState("");
  const [storeCategory, setStoreCategory] = React.useState("");
  const [storeLocation, setStoreLocation] = React.useState("");
  const [storeContactPhone, setStoreContactPhone] = React.useState("");
  const [storeStatus, setStoreStatus] = React.useState<StoreFromSupabase["status"]>("Inactive");
  const [storeSocialLinks, setStoreSocialLinks] = React.useState<SocialLinkPayload[]>([]);
  
  const [storeLogo, setStoreLogo] = React.useState<string | null>(null); 
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  // Location state
  const [storePickupLat, setStorePickupLat] = React.useState<number | string>("");
  const [storePickupLng, setStorePickupLng] = React.useState<number | string>("");
  const [isFetchingLocation, setIsFetchingLocation] = React.useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = React.useState("system");

  // Password state
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);


  React.useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'system';
    setCurrentTheme(storedTheme);
    applyTheme(storedTheme, false); 
  }, []);

  // Fetch Auth User and Vendor Profile
  React.useEffect(() => {
    const fetchUserAndProfile = async () => {
      setIsLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);

      if (user) {
        const { profile, error } = await getCurrentVendorProfile(user.id);
        if (profile) {
          setUserName(profile.display_name || user.user_metadata?.display_name || user.email || "");
          setUserEmail(profile.email || user.email || "");
          setUserAvatar(profile.avatar_url || user.user_metadata?.avatar_url || null);
          setAvatarPreview(profile.avatar_url || user.user_metadata?.avatar_url || null);
          // Set payout info
          setBankName(profile.bank_name || '');
          setAccountName(profile.bank_account_name || '');
          setAccountNumber(profile.bank_account_number || '');
          setBranchName(profile.bank_branch_name || '');
          setMomoProvider(profile.mobile_money_provider || '');
          setMomoNumber(profile.mobile_money_number || '');
          setMomoName(profile.mobile_money_name || '');

        } else {
          setUserName(user.user_metadata?.display_name || user.email || "");
          setUserEmail(user.email || "");
          setUserAvatar(user.user_metadata?.avatar_url || null);
          setAvatarPreview(user.user_metadata?.avatar_url || null);
          if (error) console.warn("Error fetching vendor profile, using auth data as fallback:", error.message);
        }
      } else {
        setUserName(""); setUserEmail(""); setUserAvatar(null); setAvatarPreview(null);
      }
      setIsLoadingProfile(false);
    };
    fetchUserAndProfile();
  }, [supabase]);
  
  // Fetch Selected Store Details
  React.useEffect(() => {
    const fetchStoreDetails = async () => {
      if (storeIdFromUrl && authUser) {
        setIsLoadingStore(true);
        const { data: storeDetails, error } = await getStoreById(storeIdFromUrl, authUser.id);
        if (error) {
          toast({ variant: "destructive", title: "Error Fetching Store", description: error.message });
          setSelectedStore(null);
          // Reset form fields if store not found or error
          setStoreName(""); setStoreDescription(""); setStoreCategory(""); setStoreLocation("");
          setStoreContactPhone(""); 
          setStorePickupLat(""); setStorePickupLng("");
          setStoreStatus("Inactive"); setStoreSocialLinks([]); setStoreLogo(null); 
          setLogoPreview(null);
        } else if (storeDetails) {
          setSelectedStore(storeDetails);
          setStoreName(storeDetails.name);
          setStoreDescription(storeDetails.description);
          setStoreCategory(storeDetails.category);
          setStoreLocation(storeDetails.location || "");
          setStoreContactPhone(storeDetails.contact_phone || "");
          setStorePickupLat(storeDetails.pickup_latitude || "");
          setStorePickupLng(storeDetails.pickup_longitude || "");
          setStoreStatus(storeDetails.status);
          setStoreSocialLinks(storeDetails.social_links || []);
          setStoreLogo(storeDetails.logo_url);
          setLogoPreview(storeDetails.logo_url);
        }
        setIsLoadingStore(false);
      } else {
        setSelectedStore(null); 
         // Reset form fields if no storeId or no authUser
         setStoreName(""); setStoreDescription(""); setStoreCategory(""); setStoreLocation("");
         setStoreContactPhone(""); 
         setStorePickupLat(""); setStorePickupLng("");
         setStoreStatus("Inactive"); setStoreSocialLinks([]); setStoreLogo(null); 
         setLogoPreview(null);
      }
    };
    fetchStoreDetails();
  }, [storeIdFromUrl, authUser, toast]);


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
      if (avatarPreview && (avatarPreview.startsWith('blob:') || avatarFile)) {
         URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarFile(null);
      if (avatarPreview && (avatarPreview.startsWith('blob:') || avatarFile)) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(userAvatar); 
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to update your profile." });
      return;
    }
    setIsLoadingProfile(true);
    let newAvatarUrl = userAvatar; 

    if (avatarFile) {
      const { publicUrl, error: uploadError } = await uploadAvatar(authUser.id, avatarFile);
      if (uploadError) {
        toast({ variant: "destructive", title: "Avatar Upload Failed", description: uploadError.message || "Could not process the image." });
        setIsLoadingProfile(false);
        return;
      }
      if (publicUrl) newAvatarUrl = publicUrl;
    }

    const { profile, error: updateError } = await updateCurrentVendorProfile(authUser.id, {
      display_name: userName,
      email: userEmail, 
      avatar_url: newAvatarUrl,
    });

    if (updateError) {
      toast({ variant: "destructive", title: "Profile Update Failed", description: updateError.message || "Could not save profile changes." });
    } else {
      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
      if (profile) {
        setUserName(profile.display_name || "");
        setUserEmail(profile.email || "");
        setUserAvatar(profile.avatar_url || null);
        setAvatarPreview(profile.avatar_url || null); 
      }
      setAvatarFile(null); 
    }
    setIsLoadingProfile(false);
  };
  
  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      if (logoPreview && (logoPreview.startsWith('blob:') || logoFile)) URL.revokeObjectURL(logoPreview);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      if (logoPreview && (logoPreview.startsWith('blob:') || logoFile)) URL.revokeObjectURL(logoPreview);
      setLogoPreview(storeLogo); 
    }
  };

  const handleStoreSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !authUser) {
        toast({ variant: "destructive", title: "Error", description: "No store selected or user not authenticated." });
        return;
    }
    setIsLoadingStore(true);

    const payload: StorePayload = {
        name: storeName,
        description: storeDescription,
        category: storeCategory,
        location: storeLocation || null,
        contact_phone: storeContactPhone || null,
        pickup_latitude: storePickupLat ? parseFloat(String(storePickupLat)) : null,
        pickup_longitude: storePickupLng ? parseFloat(String(storePickupLng)) : null,
        status: storeStatus,
        social_links: storeSocialLinks.filter(link => link.url.trim() !== ''),
        logo_url: logoPreview, // Pass current preview; service handles if it's old or new data URI
    };
    
    const { data: updatedStore, error } = await updateStore(selectedStore.id, authUser.id, payload, logoFile);
    
    if (error) {
        toast({ variant: "destructive", title: "Store Update Failed", description: error.message });
    } else if (updatedStore) {
        toast({ title: "Store Settings Updated", description: `${updatedStore.name} settings have been saved.` });
        setSelectedStore(updatedStore);
        setStoreLogo(updatedStore.logo_url);
        setLogoPreview(updatedStore.logo_url);
        setLogoFile(null); 
    }
    setIsLoadingStore(false);
  };

  const handleSocialLinkChange = (platform: SocialLinkPayload["platform"], url: string) => {
    setStoreSocialLinks(prevLinks => {
        const existingLinkIndex = prevLinks.findIndex(link => link.platform === platform);
        if (existingLinkIndex > -1) {
            if (url.trim() === "") { 
                return prevLinks.filter(link => link.platform !== platform);
            }
            const updatedLinks = [...prevLinks];
            updatedLinks[existingLinkIndex] = { ...updatedLinks[existingLinkIndex], url };
            return updatedLinks;
        } else if (url.trim() !== "") { 
            return [...prevLinks, { platform, url }];
        }
        return prevLinks; 
    });
  };
  
  const getSocialUrl = (platform: SocialLinkPayload["platform"]) => storeSocialLinks.find(link => link.platform === platform)?.url || "";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please enter and confirm your new password." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Do Not Match", description: "Please re-enter your new password." });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Password Too Short", description: "Password must be at least 6 characters long." });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);
    
    if (error) {
        toast({ variant: "destructive", title: "Password Update Failed", description: error.message });
    } else {
        toast({ title: "Password Updated", description: "Your password has been successfully updated." });
        setNewPassword("");
        setConfirmPassword("");
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation Not Supported" });
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setStorePickupLat(latitude);
        setStorePickupLng(longitude);
        setIsFetchingLocation(false);
        toast({ title: "Location Captured", description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}` });
      },
      (error) => {
        let errorMessage = "Could not get location.";
        if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access was denied. Please enable location permissions for this site in your browser settings.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        toast({ variant: "destructive", title: "Geolocation Failed", description: errorMessage });
        setIsFetchingLocation(false);
      }
    );
  };

  const handleSavePayoutDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    setIsUpdatingPayout(true);

    const payload: VendorProfileUpdatePayload = {
      bank_name: bankName,
      bank_account_name: accountName,
      bank_account_number: accountNumber,
      bank_branch_name: branchName,
      mobile_money_provider: momoProvider,
      mobile_money_number: momoNumber,
      mobile_money_name: momoName,
    };
    
    const { error } = await updateCurrentVendorProfile(authUser.id, payload);
    
    if (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not save payout details." });
    } else {
      toast({ title: "Payout Details Saved", description: "Your payout information has been successfully updated." });
    }
    setIsUpdatingPayout(false);
  };

  React.useEffect(() => {
    return () => { 
      if (avatarPreview && (avatarPreview.startsWith('blob:') || avatarFile)) URL.revokeObjectURL(avatarPreview);
      if (logoPreview && (logoPreview.startsWith('blob:') || logoFile)) URL.revokeObjectURL(logoPreview);
    };
  }, [avatarPreview, avatarFile, logoPreview, logoFile]);


  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex flex-wrap w-full gap-1 mb-6 h-auto justify-start md:gap-0 md:grid md:grid-cols-5">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4 inline-block md:hidden lg:inline-block"/>Profile</TabsTrigger>
          <TabsTrigger value="store"><Building className="mr-2 h-4 w-4 inline-block md:hidden lg:inline-block"/>Store</TabsTrigger>
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
              {isLoadingProfile ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <Skeleton className="h-8 w-40" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Button disabled className="mt-4"> <Skeleton className="h-5 w-20" /> </Button>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={avatarPreview || undefined} alt={userName || "User"} />
                      <AvatarFallback>{userName ? userName.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
                    </Avatar>
                     <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="avatarFile">Upload Avatar</Label>
                      <Input id="avatarFile" type="file" accept="image/*" onChange={handleAvatarFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" value={userName || ''} onChange={(e) => setUserName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={userEmail || ''} onChange={(e) => setUserEmail(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={isLoadingProfile}> {isLoadingProfile ? "Updating..." : "Update Profile"} </Button>
                </form>
              )}
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
            {isLoadingStore ? (
                 <CardContent>
                    <div className="space-y-6">
                        <Skeleton className="h-32 w-32 rounded-md mx-auto" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-1/2" />
                        <Button disabled className="mt-4"> <Skeleton className="h-5 w-20" /> </Button>
                    </div>
                 </CardContent>
            ) : selectedStore ? (
              <CardContent>
                <form onSubmit={handleStoreSettingsUpdate} className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                     {logoPreview ? (
                        <NextImage src={logoPreview} alt={`${storeName} logo preview`} width={128} height={128} className="rounded-md object-contain h-32 w-32 border" unoptimized={logoPreview?.startsWith('blob:')} />
                      ) : (
                        <div className="h-32 w-32 rounded-md border bg-muted flex items-center justify-center">
                          <UploadCloud className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="storeLogoFile">Upload Store Logo</Label>
                        <Input id="storeLogoFile" type="file" accept="image/*" onChange={handleLogoFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"/>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" value={storeName || ''} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="storeDescription">Description</Label>
                    <Textarea id="storeDescription" value={storeDescription || ''} onChange={(e) => setStoreDescription(e.target.value)} />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="storeCategory">Category</Label>
                        <Input id="storeCategory" value={storeCategory || ''} onChange={(e) => setStoreCategory(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="storeLocation">Store Location / Address</Label>
                        <Input id="storeLocation" value={storeLocation || ''} onChange={(e) => setStoreLocation(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="storeContactPhone">Contact Phone</Label>
                        <Input id="storeContactPhone" type="tel" value={storeContactPhone || ''} onChange={(e) => setStoreContactPhone(e.target.value)} />
                    </div>
                   </div>
                   
                    <Separator />
                    <h4 className="text-md font-medium">Default Pickup Coordinates</h4>
                    <p className="text-sm text-muted-foreground -mt-2">Provide precise coordinates for map links during order processing.</p>
                    
                    <Button variant="outline" className="w-full" type="button" onClick={handleUseCurrentLocation} disabled={isFetchingLocation}>
                        <LocateFixed className="mr-2 h-4 w-4"/> {isFetchingLocation ? "Fetching..." : "Use Current GPS Location"}
                    </Button>

                    <div className="grid gap-2">
                        <Label htmlFor="pickupCoords">Coordinates (Lat, Lng)</Label>
                        <Input
                            id="pickupCoords"
                            value={storePickupLat && storePickupLng ? `${storePickupLat}, ${storePickupLng}` : ""}
                            onChange={(e) => {
                                const [latStr, lngStr] = e.target.value.split(',').map(s => s.trim());
                                const lat = parseFloat(latStr);
                                const lng = parseFloat(lngStr);
                                setStorePickupLat(!isNaN(lat) ? lat : "");
                                setStorePickupLng(!isNaN(lng) ? lng : "");
                            }}
                            placeholder="e.g., -15.4167, 28.2833"
                        />
                    </div>
                    {storePickupLat && storePickupLng ? (
                        <div className="space-y-2 rounded-md border p-3">
                            <p className="text-sm font-medium">Map Links</p>
                            <p className="text-xs text-muted-foreground">Click to open, or copy coordinates.</p>
                            <div className="flex items-center gap-2">
                                <a href={`https://www.google.com/maps/search/?api=1&query=${storePickupLat},${storePickupLng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3"/>Google Maps</a>
                                <span>|</span>
                                <a href={`http://maps.apple.com/?q=${storePickupLat},${storePickupLng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3"/>Apple Maps</a>
                                <Button size="icon" variant="ghost" type="button" className="h-6 w-6 ml-auto" onClick={() => {
                                    navigator.clipboard.writeText(`${storePickupLat}, ${storePickupLng}`);
                                    toast({title: "Copied to clipboard"});
                                }}>
                                    <Copy className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    ) : null}

                   <div className="grid gap-2">
                        <Label htmlFor="storeStatus">Status</Label>
                        <Select value={storeStatus} onValueChange={(value: StoreFromSupabase["status"]) => setStoreStatus(value)}>
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
                    {(["Instagram", "Facebook", "Twitter", "TikTok", "LinkedIn", "Other"] as const).map((platform) => {
                       const IconComp = socialIconMap[platform as MockSocialLinkType["platform"]] || LinkIcon;
                       return (
                        <div key={platform} className="grid gap-2">
                            <Label htmlFor={`social${platform}`} className="flex items-center"><IconComp className="mr-2 h-4 w-4 text-muted-foreground"/> {platform} URL</Label>
                            <Input 
                                id={`social${platform}`} 
                                value={getSocialUrl(platform)} 
                                onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                                placeholder={`https://${platform.toLowerCase().replace(/\s+/g, '')}.com/yourstore`}
                            />
                        </div>
                       );
                    })}
                  <Button type="submit" disabled={isLoadingStore}> {isLoadingStore ? "Saving..." : "Update Store Settings"} </Button>
                </form>
              </CardContent>
            ) : (
                <CardContent>
                    <p className="text-muted-foreground">No store selected or found. Please select a store from the sidebar, or ensure the store ID in the URL is correct and you have access to it.</p>
                    <Button onClick={() => router.push('/stores')} className="mt-4">Go to Stores Page</Button>
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
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isUpdatingPassword} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isUpdatingPassword}/>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" disabled={isUpdatingPassword}>{isUpdatingPassword ? 'Updating...' : 'Change Password'}</Button>
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
          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Current Payout Methods</CardTitle>
                    <CardDescription>This is the information on file for your payouts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     {isLoadingProfile ? (
                        <Skeleton className="h-24 w-full" />
                    ) : (bankName || momoNumber) ? (
                        <>
                            {bankName && (
                                <div className="space-y-2 rounded-lg border p-4">
                                    <h4 className="font-medium flex items-center"><Banknote className="mr-2 h-5 w-5 text-primary" /> Bank Account</h4>
                                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <dt className="text-muted-foreground">Bank:</dt><dd>{bankName}</dd>
                                        <dt className="text-muted-foreground">Account Name:</dt><dd>{accountName}</dd>
                                        <dt className="text-muted-foreground">Account Number:</dt><dd>{accountNumber}</dd>
                                        <dt className="text-muted-foreground">Branch:</dt><dd>{branchName}</dd>
                                    </dl>
                                </div>
                            )}
                            {momoNumber && (
                                <div className="space-y-2 rounded-lg border p-4">
                                    <h4 className="font-medium flex items-center"><Phone className="mr-2 h-5 w-5 text-primary" /> Mobile Money</h4>
                                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <dt className="text-muted-foreground">Provider:</dt><dd className="capitalize">{momoProvider}</dd>
                                        <dt className="text-muted-foreground">Number:</dt><dd>{momoNumber}</dd>
                                        <dt className="text-muted-foreground">Registered Name:</dt><dd>{momoName}</dd>
                                    </dl>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">You have not set up any payout methods. Please add your details below.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Pencil className="h-5 w-5"/> Edit Payout Information</CardTitle>
                <CardDescription>Manage where you receive your money. Fill in at least one method.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePayoutDetails} className="space-y-8">
                  {/* Bank Account Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2"><Banknote className="h-5 w-5 text-primary"/>Bank Account Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input id="bankName" value={bankName || ''} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., Zanaco" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="accountName">Account Holder Name</Label>
                        <Input id="accountName" value={accountName || ''} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g., John Doe" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input id="accountNumber" value={accountNumber || ''} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g., 1234567890" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="branchName">Branch Name</Label>
                        <Input id="branchName" value={branchName || ''} onChange={(e) => setBranchName(e.target.value)} placeholder="e.g., Manda Hill" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Mobile Money Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2"><Phone className="h-5 w-5 text-primary"/>Mobile Money Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="momoProvider">Provider</Label>
                        <Select value={momoProvider || ''} onValueChange={setMomoProvider}>
                          <SelectTrigger id="momoProvider">
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                            <SelectItem value="airtel">Airtel Money</SelectItem>
                            <SelectItem value="zamtel">Zamtel Kwacha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="momoNumber">Mobile Number</Label>
                        <Input id="momoNumber" value={momoNumber || ''} onChange={(e) => setMomoNumber(e.target.value)} placeholder="e.g., 0966123456" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="momoName">Registered Name</Label>
                        <Input id="momoName" value={momoName || ''} onChange={(e) => setMomoName(e.target.value)} placeholder="e.g., John Doe" />
                      </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button type="submit" disabled={isUpdatingPayout}>{isUpdatingPayout ? 'Saving...' : 'Save Payout Details'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
