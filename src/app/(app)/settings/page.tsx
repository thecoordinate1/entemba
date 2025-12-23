"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NextImage from "next/image";
import type { User as AuthUser } from '@supabase/supabase-js';
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Instagram, Facebook, Twitter, Link as LinkIcon, Palette, User, Shield,
  Building, UploadCloud, Banknote, Phone, MapPin, Loader2, Check,
  Store, LayoutDashboard, Eye, Image as ImageIcon
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getCurrentVendorProfile, updateCurrentVendorProfile, uploadAvatar } from "@/services/userService";
import { getStoreById, updateStore, type StoreFromSupabase, type SocialLinkPayload, type StorePayload } from "@/services/storeService";
import dynamic from 'next/dynamic';

const StoreMapPicker = dynamic(() => import('@/components/StoreMapPicker'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full flex items-center justify-center bg-muted/50 rounded-lg border border-dashed animate-pulse">Loading Map...</div>
});

// --- Constants & Types ---
const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", icon: User, description: "Personal Info" },
  { id: "store", label: "Store", icon: Store, description: "Shop Branding" },
  { id: "billing", label: "Payouts", icon: Banknote, description: "Payment Methods" },
  { id: "appearance", label: "Look", icon: Palette, description: "Theme" },
  { id: "account", label: "Security", icon: Shield, description: "Password" },
];

const SOCIAL_PLATFORMS = ["Instagram", "Facebook", "Twitter", "TikTok", "LinkedIn", "Other"] as const;

// --- Helper Components ---

// 1. Mobile-First Navigation Item
const NavItem = ({
  item,
  isActive,
  onClick
}: {
  item: typeof SETTINGS_SECTIONS[0];
  isActive: boolean;
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-3 py-2 lg:px-4 lg:py-3 rounded-xl transition-all duration-300 relative shrink-0",
      isActive
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    )}
  >
    <item.icon className={cn("h-5 w-5 lg:h-5 lg:w-5 transition-transform", isActive ? "scale-110" : "scale-100")} />
    <div className="flex flex-col items-center lg:items-start leading-none">
      <span className="text-xs lg:text-sm font-medium">{item.label}</span>
      <span className="hidden lg:block text-[10px] font-normal opacity-80 mt-0.5">{item.description}</span>
    </div>
  </button>
);

// 2. Premium "Credit Card" for Payouts
const PayoutCard = ({
  type,
  title,
  subtitle,
  details,
  icon: Icon,
  colorClass
}: {
  type: string;
  title: string;
  subtitle: string;
  details: Record<string, string>;
  icon: any;
  colorClass: string
}) => (
  <div className={cn("relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.99]", colorClass)}>
    <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
    <div className="absolute bottom-0 left-0 p-24 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

    <div className="relative z-10 flex justify-between items-start mb-6">
      <div>
        <h4 className="text-lg font-bold tracking-tight opacity-90 line-clamp-1">{title}</h4>
        <p className="text-xs sm:text-sm opacity-75 font-medium">{subtitle}</p>
      </div>
      <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shrink-0">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
    </div>

    <div className="relative z-10 space-y-3">
      {Object.entries(details).map(([label, value]) => (
        <div key={label} className="flex justify-between items-baseline border-b border-white/10 pb-1 last:border-0">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider opacity-60 font-semibold">{label}</span>
          <span className="text-xs sm:text-sm font-medium tracking-wide truncate max-w-[60%]">{value || "—"}</span>
        </div>
      ))}
    </div>
  </div>
);

// 3. Store Preview Component (Reusable)
const StorePreview = ({ logoPreview, bannerPreview, storeName, storeDescription, storeCategory, storeStatus, storeLocation }: any) => (
  <div className="bg-background rounded-3xl overflow-hidden border shadow-2xl h-full flex flex-col group">
    <div className="bg-muted h-32 sm:h-40 w-full relative shrink-0 overflow-hidden">
      {bannerPreview ? (
        <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 animate-pulse-slow" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent" />
    </div>
    <div className="px-6 pb-6 relative flex-1">
      <div className="absolute -top-10 sm:-top-12 left-6">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-background bg-white shadow-lg overflow-hidden flex items-center justify-center">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-8 w-8 text-muted-foreground/30" />
          )}
        </div>
      </div>
      <div className="mt-12 sm:mt-14 space-y-2">
        <h3 className="font-bold text-xl sm:text-2xl leading-none tracking-tight">{storeName || "Your Store Name"}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{storeDescription || "Your store description will appear here. make it catchy!"}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(storeCategory || "Category").split(',').map((c: string, i: number) => (
          <span key={i} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
            {c.trim()}
          </span>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t flex justify-between items-center text-sm">
        <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5",
          storeStatus === 'Active' ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-yellow-500/10 text-yellow-600 border-yellow-200')}>
          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
            storeStatus === 'Active' ? 'bg-green-600' : 'bg-yellow-600')} />
          {storeStatus?.toUpperCase() || "INACTIVE"}
        </div>
        <div className="text-muted-foreground text-xs flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {storeLocation ? "Location Set" : "No Location"}
        </div>
      </div>
    </div>
  </div>
);


export default function SettingsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const authId = searchParams.get("id"); // unused but kept for ref
  const storeIdFromUrl = searchParams.get("storeId");
  const supabase = createClient();

  // --- State ---
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = React.useState(tabFromUrl || "profile");
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  // Loading States
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [isLoadingStore, setIsLoadingStore] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Profile Data
  const [userName, setUserName] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  // Payout Data
  const [bankName, setBankName] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [branchName, setBranchName] = React.useState('');
  const [momoProvider, setMomoProvider] = React.useState('');
  const [momoNumber, setMomoNumber] = React.useState('');
  const [momoName, setMomoName] = React.useState('');

  // Store Data
  const [selectedStore, setSelectedStore] = React.useState<StoreFromSupabase | null>(null);
  const [storeName, setStoreName] = React.useState("");
  const [storeDescription, setStoreDescription] = React.useState("");
  const [storeCategory, setStoreCategory] = React.useState("");
  const [storeLocation, setStoreLocation] = React.useState("");
  const [storeContactPhone, setStoreContactPhone] = React.useState("");
  const [storeStatus, setStoreStatus] = React.useState<StoreFromSupabase["status"]>("Inactive");
  const [storeSocialLinks, setStoreSocialLinks] = React.useState<SocialLinkPayload[]>([]);

  const [storeLogo, setStoreLogo] = React.useState<string | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  const [storeBanner, setStoreBanner] = React.useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);

  const [storePickupLat, setStorePickupLat] = React.useState<number | string>("");
  const [storePickupLng, setStorePickupLng] = React.useState<number | string>("");

  // Appearance & Account
  const { theme, setTheme } = useTheme();
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Files
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);

  // --- Effects ---

  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);

      if (user) {
        const { profile } = await getCurrentVendorProfile(user.id);
        if (profile) {
          setUserName(profile.display_name || user.user_metadata?.display_name || "");
          setUserEmail(profile.email || user.email || "");
          setUserAvatar(profile.avatar_url || user.user_metadata?.avatar_url || null);
          setAvatarPreview(profile.avatar_url || user.user_metadata?.avatar_url || null);

          setBankName(profile.bank_name || '');
          setAccountName(profile.bank_account_name || '');
          setAccountNumber(profile.bank_account_number || '');
          setBranchName(profile.bank_branch_name || '');
          setMomoProvider(profile.mobile_money_provider || '');
          setMomoNumber(profile.mobile_money_number || '');
          setMomoName(profile.mobile_money_name || '');
        }
      }
      setIsLoadingProfile(false);
    };
    fetchUser();
  }, [supabase]);

  React.useEffect(() => {
    const fetchStore = async () => {
      if (storeIdFromUrl && authUser) {
        setIsLoadingStore(true);
        const { data: store } = await getStoreById(storeIdFromUrl, authUser.id);
        if (store) {
          setSelectedStore(store);
          setStoreName(store.name);
          setStoreDescription(store.description);
          setStoreCategory((store.categories || []).join(', '));
          setStoreLocation(store.location || "");
          setStoreContactPhone(store.contact_phone || "");
          setStorePickupLat(store.pickup_latitude || "");
          setStorePickupLng(store.pickup_longitude || "");
          setStoreStatus(store.status);
          setStoreSocialLinks(store.social_links || []);

          setStoreLogo(store.logo_url);
          setLogoPreview(store.logo_url);

          setStoreBanner(store.banner_url);
          setBannerPreview(store.banner_url);
        }
        setIsLoadingStore(false);
      }
    };
    fetchStore();
  }, [storeIdFromUrl, authUser]);

  // Clean up blob URLs
  React.useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      if (bannerPreview && bannerPreview.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
    };
  }, [avatarPreview, logoPreview, bannerPreview]);


  // --- Handlers ---

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setIsSaving(true);

    let newAvatarUrl = userAvatar;
    if (avatarFile) {
      const { publicUrl } = await uploadAvatar(authUser.id, avatarFile);
      if (publicUrl) newAvatarUrl = publicUrl;
    }

    const { error } = await updateCurrentVendorProfile(authUser.id, {
      display_name: userName,
      email: userEmail,
      avatar_url: newAvatarUrl || undefined,
    });

    setIsSaving(false);
    if (!error) toast({ title: "Profile Saved", description: "Your details have been updated." });
    else toast({ variant: "destructive", title: "Error", description: error.message });
  };

  const handleStoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !authUser) return;
    setIsSaving(true);

    const payload: StorePayload = {
      name: storeName,
      description: storeDescription,
      categories: storeCategory.split(',').map(c => c.trim()).filter(Boolean),
      location: storeLocation || null,
      contact_phone: storeContactPhone || null,
      pickup_latitude: storePickupLat ? parseFloat(String(storePickupLat)) : null,
      pickup_longitude: storePickupLng ? parseFloat(String(storePickupLng)) : null,
      status: storeStatus,
      social_links: storeSocialLinks.filter(l => l.url.trim() !== ''),
      logo_url: logoPreview,
      banner_url: bannerPreview,
    };

    const { data, error } = await updateStore(selectedStore.id, authUser.id, payload, logoFile, bannerFile);
    setIsSaving(false);

    if (data) {
      toast({ title: "Store Updated", description: "Your store settings are live." });
      setSelectedStore(data);
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: error?.message });
    }
  };

  const handleSocialLinkChange = (platform: string, url: string) => {
    setStoreSocialLinks(prev => {
      const exists = prev.find(p => p.platform === platform);
      if (exists) {
        if (!url) return prev.filter(p => p.platform !== platform);
        return prev.map(p => p.platform === platform ? { ...p, url } : p);
      }
      if (url) return [...prev, { platform: platform as any, url }];
      return prev;
    });
  };

  const handlePayoutSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setIsSaving(true);
    const { error } = await updateCurrentVendorProfile(authUser.id, {
      bank_name: bankName,
      bank_account_name: accountName,
      bank_account_number: accountNumber,
      bank_branch_name: branchName,
      mobile_money_provider: momoProvider,
      mobile_money_number: momoNumber,
      mobile_money_name: momoName
    });
    setIsSaving(false);
    if (!error) toast({ title: "Payout Details Saved" });
    else toast({ variant: "destructive", title: "Error", description: error.message });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast({ variant: "destructive", title: "Passwords do not match" });
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSaving(false);
    if (!error) {
      toast({ title: "Password Updated" });
      setNewPassword(""); setConfirmPassword("");
    } else {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  // --- Render Sections ---

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6 pb-20 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Avatar Card */}
              <Card className="w-full md:w-80 shadow-sm border-border/60">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">Profile Photo</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 text-white font-medium">
                      <UploadCloud className="w-8 h-8 mb-1" />
                    </div>
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-muted shadow-xl">
                      <AvatarImage src={avatarPreview || ""} className="object-cover" />
                      <AvatarFallback className="text-4xl bg-muted">{userName ? userName[0]?.toUpperCase() : "U"}</AvatarFallback>
                    </Avatar>
                    <Input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="w-full relative">
                    Change Photo
                    <Input type="file" className="absolute inset-0 opacity-0" accept="image/*" onChange={handleAvatarChange} />
                  </Button>
                </CardContent>
              </Card>

              {/* Info Form */}
              <Card className="flex-1 w-full shadow-sm border-border/60">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your public display name.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="profile-form" onSubmit={handleProfileSave} className="space-y-5">
                    <div className="grid gap-2">
                      <Label htmlFor="display_name" className="text-base">Display Name</Label>
                      <Input id="display_name" value={userName} onChange={e => setUserName(e.target.value)} className="h-11 bg-muted/30" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-base">Email Address</Label>
                      <Input id="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="h-11 bg-muted/30" />
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t py-4">
                  <Button type="submit" form="profile-form" disabled={isSaving} className="w-full md:w-auto ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        );

      case "store":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-20 animate-in fade-in zoom-in-95 duration-300">
            {/* Left Col: Settings Forms */}
            <div className="xl:col-span-2 space-y-6">
              {!selectedStore ? (
                <Card className="border-dashed border-2 p-8 md:p-12 text-center text-muted-foreground">
                  <Store className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold">No Store Selected</h3>
                  <p>Please select a store to manage its settings.</p>
                </Card>
              ) : (
                <>
                  {/* Mobile Preview Trigger */}
                  <div className="xl:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="w-full gap-2 border-primary/20 text-primary">
                          <Eye className="h-4 w-4" /> Preview Store Live
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl pt-8 px-4">
                        <SheetHeader className="mb-6">
                          <SheetTitle>Live Store Preview</SheetTitle>
                        </SheetHeader>
                        <StorePreview
                          logoPreview={logoPreview}
                          bannerPreview={bannerPreview}
                          storeName={storeName}
                          storeDescription={storeDescription}
                          storeCategory={storeCategory}
                          storeStatus={storeStatus}
                          storeLocation={storeLocation}
                        />
                      </SheetContent>
                    </Sheet>
                  </div>

                  <form id="store-form" onSubmit={handleStoreSave} className="space-y-6">
                    {/* General */}
                    <Card className="shadow-sm border-border/60">
                      <CardHeader>
                        <CardTitle>Branding</CardTitle>
                        <CardDescription>Logo and Cover Image</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Logo Input */}
                        <div className="flex items-center gap-4">
                          <div className="relative h-20 w-20 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {logoPreview && <img src={logoPreview} className="w-full h-full object-cover" />}
                            {!logoPreview && <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                            <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoChange} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">Store Logo</p>
                            <p className="text-xs text-muted-foreground">Tap to upload a new logo.</p>
                          </div>
                        </div>

                        {/* Banner Input */}
                        <div className="space-y-3">
                          <Label className="text-base">Store Banner</Label>
                          <div className="relative h-32 w-full rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center overflow-hidden cursor-pointer group">
                            {bannerPreview ? (
                              <>
                                <img src={bannerPreview} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                                <div className="z-10 bg-black/40 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ImageIcon className="h-4 w-4" /> Change Banner
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageIcon className="h-8 w-8 opacity-50" />
                                <span className="text-sm">Tap to upload banner image</span>
                              </div>
                            )}
                            <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" onChange={handleBannerChange} />
                          </div>
                          <p className="text-xs text-muted-foreground">Recommended size: 1200x400px. Max size 3MB.</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border/60">
                      <CardHeader>
                        <CardTitle>Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="text-base">Store Name</Label>
                            <Input value={storeName} onChange={e => setStoreName(e.target.value)} className="h-11" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-base">Categories</Label>
                            <Input value={storeCategory} onChange={e => setStoreCategory(e.target.value)} className="h-11" placeholder="Fashion, tech..." />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-base">Description</Label>
                          <Textarea rows={3} value={storeDescription} onChange={e => setStoreDescription(e.target.value)} className="resize-none" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-base">Status</Label>
                          <Select value={storeStatus} onValueChange={(v: any) => setStoreStatus(v)}>
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active -- Visible</SelectItem>
                              <SelectItem value="Inactive">Inactive -- Hidden</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact & Location */}
                    <Card className="shadow-sm border-border/60">
                      <CardHeader>
                        <CardTitle>Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="text-base">Phone Number</Label>
                            <Input type="tel" value={storeContactPhone} onChange={e => setStoreContactPhone(e.target.value)} className="h-11" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-base">Physical Address</Label>
                            <Input value={storeLocation} onChange={e => setStoreLocation(e.target.value)} className="h-11" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Pin Location</Label>
                          <div className="rounded-lg overflow-hidden border h-[250px] md:h-[300px]">
                            <StoreMapPicker
                              latitude={storePickupLat ? parseFloat(String(storePickupLat)) : undefined}
                              longitude={storePickupLng ? parseFloat(String(storePickupLng)) : undefined}
                              onLocationSelect={(lat, lng) => { setStorePickupLat(lat); setStorePickupLng(lng); }}
                            />
                          </div>
                          <div className="flex gap-4 pt-2">
                            <div className="grid gap-1.5 flex-1">
                              <Label className="text-xs text-muted-foreground">Latitude</Label>
                              <Input
                                value={storePickupLat || ''}
                                readOnly
                                className="h-9 bg-muted/50 text-xs font-mono"
                                placeholder="Select on map"
                              />
                            </div>
                            <div className="grid gap-1.5 flex-1">
                              <Label className="text-xs text-muted-foreground">Longitude</Label>
                              <Input
                                value={storePickupLng || ''}
                                readOnly
                                className="h-9 bg-muted/50 text-xs font-mono"
                                placeholder="Select on map"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Socials */}
                    <Card className="shadow-sm border-border/60">
                      <CardHeader>
                        <CardTitle>Socials</CardTitle>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 gap-4">
                        {SOCIAL_PLATFORMS.map(platform => (
                          <div key={platform} className="grid gap-2">
                            <Label className="text-xs uppercase text-muted-foreground">{platform}</Label>
                            <Input
                              placeholder={`https://${platform.toLowerCase()}.com/...`}
                              value={storeSocialLinks.find(l => l.platform === platform)?.url || ''}
                              onChange={e => handleSocialLinkChange(platform, e.target.value)}
                              className="bg-muted/20 h-10"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Floating Save Bar for Mobile/Desktop */}
                    <div className="sticky bottom-4 md:bottom-6 z-10 mx-auto max-w-4xl">
                      <div className="bg-background/90 backdrop-blur-xl border rounded-2xl p-4 flex items-center justify-between shadow-2xl ring-1 ring-black/5">
                        <div className="text-sm text-muted-foreground hidden md:block pl-2">
                          Changes pending...
                        </div>
                        <Button type="submit" size="lg" disabled={isSaving} className="w-full md:w-auto shadow-lg shadow-primary/20 h-11 rounded-xl font-semibold">
                          {isSaving ? "Saving..." : "Save Store Settings"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Right Col: Live Preview (Desktop Only) */}
            <div className="hidden xl:block">
              <div className="sticky top-6 space-y-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <LayoutDashboard className="h-4 w-4" /> Live Preview
                </div>
                <StorePreview
                  logoPreview={logoPreview}
                  bannerPreview={bannerPreview}
                  storeName={storeName}
                  storeDescription={storeDescription}
                  storeCategory={storeCategory}
                  storeStatus={storeStatus}
                  storeLocation={storeLocation}
                />
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Top Tip</p>
                  <p className="opacity-90">Store logos with white backgrounds look best in the preview.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-8 pb-20 animate-in fade-in zoom-in-95 duration-300">
            {/* Cards Visualization */}
            <div className="grid md:grid-cols-2 gap-6">
              <PayoutCard
                type="bank"
                title={bankName || "Bank Account"}
                subtitle="Primary Payout Method"
                icon={Building}
                colorClass="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950"
                details={{
                  "Account": accountName,
                  "Number": accountNumber ? `**** ${accountNumber.slice(-4)}` : "",
                  "Bank": bankName || "Not Connected"
                }}
              />
              <PayoutCard
                type="momo"
                title={momoProvider || "Mobile Money"}
                subtitle="Alternative Method"
                icon={Phone}
                colorClass="bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20"
                details={{
                  "Name": momoName,
                  "Number": momoNumber || "Not Connected",
                  "Provider": momoProvider
                }}
              />
            </div>

            <Card className="border-border/60 shadow-md">
              <CardHeader>
                <CardTitle>Edit Payout Details</CardTitle>
                <CardDescription>Securely manage where you receive your funds.</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="payout-form" onSubmit={handlePayoutSave} className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                      <Building className="h-5 w-5" /> Bank Details
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2"><Label>Bank Name</Label><Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Absa" className="h-11" /></div>
                      <div className="grid gap-2"><Label>Account Name</Label><Input value={accountName} onChange={e => setAccountName(e.target.value)} className="h-11" /></div>
                      <div className="grid gap-2"><Label>Account Number</Label><Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="h-11" /></div>
                      <div className="grid gap-2"><Label>Branch Code/Name</Label><Input value={branchName} onChange={e => setBranchName(e.target.value)} className="h-11" /></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                      <Phone className="h-5 w-5" /> Mobile Money
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Provider</Label>
                        <Select value={momoProvider} onValueChange={setMomoProvider}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Select Provider" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Airtel">Airtel Money</SelectItem>
                            <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                            <SelectItem value="Zamtel">Zamtel Kwacha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2"><Label>Phone Number</Label><Input value={momoNumber} onChange={e => setMomoNumber(e.target.value)} placeholder="+260..." className="h-11" /></div>
                      <div className="grid gap-2 md:col-span-2"><Label>Registered Name</Label><Input value={momoName} onChange={e => setMomoName(e.target.value)} className="h-11" /></div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t py-4">
                <Button type="submit" form="payout-form" disabled={isSaving} className="w-full md:w-auto ml-auto h-11">
                  {isSaving ? "Processing..." : "Update Payout Info"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        );

      case "appearance":
        return (
          <div className="max-w-xl space-y-6 pb-20 animate-in fade-in zoom-in-95 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose how E-Ntemba looks to you.</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={theme} onValueChange={(v) => setTheme(v)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map((t) => (
                    <div key={t}>
                      <RadioGroupItem value={t} id={t} className="peer sr-only" />
                      <Label
                        htmlFor={t}
                        className="flex sm:flex-col items-center justify-between sm:justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all gap-4"
                      >
                        <span className="capitalize font-medium">{t}</span>
                        <div className={cn(
                          "h-12 w-20 sm:h-20 sm:w-full rounded-lg border shadow-sm flex items-center justify-center text-[10px] font-mono",
                          t === 'light' && "bg-white text-slate-800",
                          t === 'dark' && "bg-slate-950 text-slate-200",
                          t === 'system' && "bg-gradient-to-br from-white to-slate-900 text-slate-500"
                        )}>
                          Aa
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        );

      case "account":
        return (
          <div className="max-w-2xl space-y-6 pb-20 animate-in fade-in zoom-in-95 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Ensure your account is using a strong password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>New Password</Label>
                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-11" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Confirm Password</Label>
                    <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-11" />
                  </div>
                  <Button type="submit" disabled={isSaving} variant="outline" className="w-full sm:w-fit h-11">
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="opacity-75">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage your alert preferences.</CardDescription>
                </div>
                <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider border">
                  Coming Soon
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: "email_notifs", label: "Email Notifications", desc: "Weekly summaries." },
                  { id: "order_notifs", label: "New Orders", desc: "Alerted immediately." },
                  { id: "stock_notifs", label: "Low Stock", desc: "Inventory alerts." },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 grayscale opacity-60 cursor-not-allowed">
                    <div className="space-y-0.5">
                      <Label className="text-base cursor-not-allowed">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch disabled checked={false} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-muted/10">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-background border-b lg:border-b-0 lg:border-r p-3 lg:p-6 sticky top-0 z-20 shadow-sm lg:shadow-none">
        <div className="mb-8 hidden lg:block">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your empire.</p>
        </div>

        <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {SETTINGS_SECTIONS.map(item => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-10 w-full max-w-7xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">
            {SETTINGS_SECTIONS.find(s => s.id === activeTab)?.label}
          </h2>
          <p className="text-muted-foreground text-sm lg:text-lg">
            {SETTINGS_SECTIONS.find(s => s.id === activeTab)?.description}
          </p>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}
