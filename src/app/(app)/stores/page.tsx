"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreVertical,
  PlusCircle,
  Edit,
  Trash2,
  MapPin,
  Eye,
  Tag,
  Instagram,
  Facebook,
  Twitter,
  Link as LinkIconLucide,
  UploadCloud,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  ImageIcon,
  Store as StoreIcon,
  Search
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Store as MockStoreType, SocialLink as MockSocialLinkType, StoreStatus } from "@/lib/types";
import { storeStatusColors } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  createStore,
  getStoresByUserId,
  updateStore,
  deleteStore,
  type StorePayload,
  type StoreFromSupabase,
  type SocialLinkPayload as StoreSocialLinkPayload
} from "@/services/storeService";
import StoreMapPicker from "@/components/StoreMapPicker";

interface ImageSlot {
  file: File | null;
  previewUrl: string | null;
  dataUri: string | null;
}

const initialImageSlot = (): ImageSlot => ({
  file: null,
  previewUrl: null,
  dataUri: null,
});

const socialIconMap: Record<string, React.ElementType> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Twitter: Twitter,
  TikTok: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.47.02-4.8-.73-6.66-2.48-1.85-1.75-2.95-4.02-2.95-6.42 0-2.55 1.28-4.91 3.22-6.49L8.63 9.9c.02-.42.02-.85.02-1.28.02-2.21.02-4.41.02-6.62l2.48-.01c.01.83.01 1.66.01 2.49.01 1.07.01 2.13.01 3.2 0 .39-.03.79-.03 1.18.2-.02.4-.04.6-.05.02-.36.01-.72.02-1.08.01-1.22.01-2.43.01-3.65z"></path></svg>,
  LinkedIn: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>,
  Other: LinkIconLucide,
};

// Map helper
const mapStoreFromSupabaseToMockStore = (store: StoreFromSupabase): MockStoreType => ({
  id: store.id,
  name: store.name,
  description: store.description,
  logo: store.logo_url || "",
  banner: store.banner_url || undefined,
  status: store.status as MockStoreType["status"],
  categories: store.categories,
  socialLinks: store.social_links.map(sl => ({ platform: sl.platform as MockSocialLinkType["platform"], url: sl.url })),
  location: store.location || undefined,
  contactPhone: store.contact_phone || undefined,
  contactEmail: store.contact_email || undefined,
  contactWebsite: store.contact_website || undefined,
  slug: store.slug || undefined,
  pickupLatitude: store.pickup_latitude || undefined,
  pickupLongitude: store.pickup_longitude || undefined,
  createdAt: new Date(store.created_at).toISOString().split("T")[0],
  isVerified: store.is_verified,
  commissionRate: store.commission_rate || undefined,
  averageRating: store.average_rating,
  reviewCount: store.review_count,
});

export default function StoresPage() {
  const [stores, setStores] = React.useState<MockStoreType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedStore, setSelectedStore] = React.useState<MockStoreType | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const [authUser, setAuthUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("general");

  // Search, Filter, and Sort States
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"All" | StoreStatus>("All");
  const [sortOption, setSortOption] = React.useState<"Newest" | "Oldest" | "Name" | "Highest Rated">("Newest");

  // Form States
  const [formLogoSlot, setFormLogoSlot] = React.useState<ImageSlot>(initialImageSlot());
  const [formBannerSlot, setFormBannerSlot] = React.useState<ImageSlot>(initialImageSlot());
  const [formStoreName, setFormStoreName] = React.useState("");
  const [formSlug, setFormSlug] = React.useState("");
  const [formStoreDescription, setFormStoreDescription] = React.useState("");
  const [formStoreCategories, setFormStoreCategories] = React.useState<string>("");
  const [formStoreLocation, setFormStoreLocation] = React.useState("");
  const [formStoreContactPhone, setFormStoreContactPhone] = React.useState("");
  const [formStoreContactEmail, setFormStoreContactEmail] = React.useState("");
  const [formStoreContactWebsite, setFormStoreContactWebsite] = React.useState("");
  const [formStorePickupLat, setFormStorePickupLat] = React.useState<number | string>("");
  const [formStorePickupLng, setFormStorePickupLng] = React.useState<number | string>("");
  const [formStoreStatus, setFormStoreStatus] = React.useState<StoreStatus>("Inactive");
  const [formSocialLinks, setFormSocialLinks] = React.useState<StoreSocialLinkPayload[]>([]);

  React.useEffect(() => {
    const getUserAndStores = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      if (user) {
        const { data: userStoresFromSupabase, error } = await getStoresByUserId(user.id);
        if (error) {
          toast({ variant: "destructive", title: "Error fetching stores", description: error.message });
          setStores([]);
        } else if (userStoresFromSupabase) {
          setStores(userStoresFromSupabase.map(mapStoreFromSupabaseToMockStore));
        }
      } else {
        setStores([]);
      }
      setIsLoading(false);
    };
    getUserAndStores();
  }, [supabase, toast]);

  const resetImageSlot = (slotSetter: React.Dispatch<React.SetStateAction<ImageSlot>>, slot: ImageSlot) => {
    if (slot.previewUrl && slot.file) URL.revokeObjectURL(slot.previewUrl);
    slotSetter(initialImageSlot());
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    slotSetter: React.Dispatch<React.SetStateAction<ImageSlot>>
  ) => {
    const file = event.target.files?.[0];
    slotSetter(prevSlot => {
      const newSlot = { ...prevSlot };
      if (newSlot.previewUrl && newSlot.file) URL.revokeObjectURL(newSlot.previewUrl);
      if (file) {
        newSlot.file = file;
        newSlot.previewUrl = URL.createObjectURL(file);
        newSlot.dataUri = null; // Clear old data URI if new file is selected
      } else {
        newSlot.file = null;
        newSlot.previewUrl = newSlot.dataUri ? newSlot.dataUri : null;
      }
      return newSlot;
    });
  };

  // Derived State: Filtered and Sorted Stores
  const filteredStores = React.useMemo(() => {
    let result = [...stores];

    // Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(store =>
        store.name.toLowerCase().includes(lowerQuery) ||
        store.description.toLowerCase().includes(lowerQuery) ||
        store.categories.some(cat => cat.toLowerCase().includes(lowerQuery))
      );
    }

    // Filter by Status
    if (statusFilter !== "All") {
      result = result.filter(store => store.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "Name":
          return a.name.localeCompare(b.name);
        case "Oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "Highest Rated":
          return b.averageRating - a.averageRating;
        case "Newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [stores, searchQuery, statusFilter, sortOption]);

  const prepareFormForEdit = (store: MockStoreType) => {
    setSelectedStore(store);
    setFormStoreName(store.name);
    setFormSlug(store.slug || "");
    setFormStoreDescription(store.description);
    setFormStoreCategories(store.categories.join(", "));
    setFormStoreLocation(store.location || "");
    setFormStoreContactPhone(store.contactPhone || "");
    setFormStoreContactEmail(store.contactEmail || "");
    setFormStoreContactWebsite(store.contactWebsite || "");
    setFormStorePickupLat(store.pickupLatitude || "");
    setFormStorePickupLng(store.pickupLongitude || "");
    setFormStoreStatus(store.status);
    setFormSocialLinks(store.socialLinks?.map(sl => ({ platform: sl.platform, url: sl.url })) || []);

    setFormLogoSlot({ file: null, previewUrl: store.logo, dataUri: store.logo });
    setFormBannerSlot({ file: null, previewUrl: store.banner || null, dataUri: store.banner || null });

    setActiveTab("general");
    setIsEditDialogOpen(true);
  };

  const resetFormFields = () => {
    setFormStoreName("");
    setFormSlug("");
    setFormStoreDescription("");
    setFormStoreCategories("");
    setFormStoreLocation("");
    setFormStoreContactPhone("");
    setFormStoreContactEmail("");
    setFormStoreContactWebsite("");
    setFormStorePickupLat("");
    setFormStorePickupLng("");
    setFormStoreStatus("Inactive");
    setFormSocialLinks([]);
    resetImageSlot(setFormLogoSlot, formLogoSlot);
    resetImageSlot(setFormBannerSlot, formBannerSlot);
    setActiveTab("general");
  };

  const processAndValidateFormData = (): StorePayload | null => {
    const categoriesArray = formStoreCategories.split(',').map(c => c.trim()).filter(Boolean);

    if (!formStoreName || !formStoreDescription || categoriesArray.length === 0) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name, Description, and at least one Category are required." });
      return null;
    }

    return {
      name: formStoreName,
      description: formStoreDescription,
      categories: categoriesArray,
      status: formStoreStatus,
      location: formStoreLocation || null,
      contact_phone: formStoreContactPhone || null,
      contact_email: formStoreContactEmail || null,
      contact_website: formStoreContactWebsite || null,
      pickup_latitude: formStorePickupLat ? parseFloat(String(formStorePickupLat)) : null,
      pickup_longitude: formStorePickupLng ? parseFloat(String(formStorePickupLng)) : null,
      slug: formSlug || null,
      logo_url: formLogoSlot.dataUri,
      banner_url: formBannerSlot.dataUri,
      social_links: formSocialLinks.filter(link => link.url.trim() !== ''),
    };
  };

  const handleAddStore = async () => {
    if (!authUser) return;
    setIsSubmitting(true);
    try {
      const storePayload = processAndValidateFormData();
      if (!storePayload) {
        setIsSubmitting(false);
        return;
      }
      const { data, error } = await createStore(authUser.id, storePayload, formLogoSlot.file, formBannerSlot.file);
      if (error) throw error;
      if (data) {
        setStores(prev => [mapStoreFromSupabaseToMockStore(data), ...prev]);
        toast({ title: "Success", description: "Store created successfully." });
        setIsAddDialogOpen(false);
        resetFormFields();
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create store." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStore = async () => {
    if (!selectedStore || !authUser) return;
    setIsSubmitting(true);
    try {
      const storePayload = processAndValidateFormData();
      if (!storePayload) {
        setIsSubmitting(false);
        return;
      }
      // Keep existing URLs if no new file and no change
      const payload: StorePayload = {
        ...storePayload,
        logo_url: formLogoSlot.file ? undefined : formLogoSlot.dataUri,
        banner_url: formBannerSlot.file ? undefined : formBannerSlot.dataUri,
      };

      const { data, error } = await updateStore(selectedStore.id, authUser.id, payload, formLogoSlot.file, formBannerSlot.file);
      if (error) throw error;
      if (data) {
        const updated = mapStoreFromSupabaseToMockStore(data);
        setStores(prev => prev.map(s => s.id === selectedStore.id ? updated : s));
        toast({ title: "Success", description: "Store updated successfully." });
        setIsEditDialogOpen(false);
        resetFormFields();
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update store." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!selectedStore || !authUser) return;
    setIsSubmitting(true);
    try {
      const { error } = await deleteStore(selectedStore.id, authUser.id);
      if (error) throw error;
      setStores(prev => prev.filter(s => s.id !== selectedStore.id));
      toast({ title: "Deleted", description: "Store deleted successfully." });
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormContent = (onSubmit: () => void) => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
        <TabsTrigger value="social">Socials</TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-grow h-[55vh] px-1">
        <form id="store-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4 py-2">

          <TabsContent value="general" className="mt-0 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Store Name <span className="text-destructive">*</span></Label>
              <Input id="name" value={formStoreName} onChange={e => setFormStoreName(e.target.value)} placeholder="e.g. Urban Threads" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Store Slug (URL)</Label>
              <div className="flex items-center">
                <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground">/shop/</span>
                <Input className="rounded-l-none" id="slug" value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="urban-threads" />
              </div>
              <p className="text-xs text-muted-foreground">Unique identifier for your store URL.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea id="description" value={formStoreDescription} onChange={e => setFormStoreDescription(e.target.value)} placeholder="Tell customers about your store..." rows={4} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categories">Categories <span className="text-destructive">*</span></Label>
              <Input id="categories" value={formStoreCategories} onChange={e => setFormStoreCategories(e.target.value)} placeholder="Clothing, Accessories, Shoes" required />
              <p className="text-xs text-muted-foreground">Separate categories with commas.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Store Status</Label>
              <Select value={formStoreStatus} onValueChange={(val: StoreStatus) => setFormStoreStatus(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="mt-0 space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Store Logo</Label>
                <div className="mt-2 flex items-start gap-4">
                  <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50 hover:bg-muted/80 transition-colors">
                    {formLogoSlot.previewUrl ? (
                      <Image src={formLogoSlot.previewUrl} alt="Logo" fill className="object-cover" unoptimized={formLogoSlot.previewUrl.startsWith('blob:')} />
                    ) : (
                      <StoreIcon className="h-8 w-8 text-muted-foreground/50" />
                    )}
                    <input type="file" accept="image/*" onChange={e => handleImageFileChange(e, setFormLogoSlot)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground pt-2">
                    <p>Recommended size: 500x500px.</p>
                    <p>Formats: JPG, PNG, WEBP.</p>
                    <Button type="button" variant="outline" size="sm" className="mt-2 relative">
                      <UploadCloud className="mr-2 h-3 w-3" /> Upload Logo
                      <input type="file" accept="image/*" onChange={e => handleImageFileChange(e, setFormLogoSlot)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Store Banner</Label>
                <div className="mt-2 group relative h-32 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50 hover:bg-muted/80 transition-colors">
                  {formBannerSlot.previewUrl ? (
                    <Image src={formBannerSlot.previewUrl} alt="Banner" fill className="object-cover" unoptimized={formBannerSlot.previewUrl?.startsWith('blob:')} />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">Click to upload banner</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={e => handleImageFileChange(e, setFormBannerSlot)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Recommended size: 1200x400px. This will be displayed at the top of your store page.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" value={formStoreContactPhone} onChange={e => setFormStoreContactPhone(e.target.value)} className="pl-9" placeholder="+260 97..." />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={formStoreContactEmail} onChange={e => setFormStoreContactEmail(e.target.value)} className="pl-9" placeholder="info@store.com" />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="website" value={formStoreContactWebsite} onChange={e => setFormStoreContactWebsite(e.target.value)} className="pl-9" placeholder="https://..." />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Physical Address</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="location" value={formStoreLocation} onChange={e => setFormStoreLocation(e.target.value)} className="pl-9" placeholder="Shop 5, Mall..." />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Pickup Location Mapping</Label>
              <div className="border rounded-md overflow-hidden">
                <StoreMapPicker
                  latitude={formStorePickupLat ? Number(formStorePickupLat) : null}
                  longitude={formStorePickupLng ? Number(formStorePickupLng) : null}
                  onLocationSelect={(lat, lng) => {
                    setFormStorePickupLat(lat);
                    setFormStorePickupLng(lng);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="lat" className="text-xs text-muted-foreground">Latitude</Label>
                  <Input id="lat" type="number" step="any" value={formStorePickupLat} onChange={e => setFormStorePickupLat(e.target.value)} placeholder="-15.387" className="h-8 text-xs" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lng" className="text-xs text-muted-foreground">Longitude</Label>
                  <Input id="lng" type="number" step="any" value={formStorePickupLng} onChange={e => setFormStorePickupLng(e.target.value)} placeholder="28.322" className="h-8 text-xs" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-0 space-y-4">
            <div className="flex flex-col gap-3">
              {["Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok"].map((platform) => {
                const IconComp = platform === 'TikTok' ? socialIconMap['TikTok'] : (socialIconMap[platform] || LinkIconLucide);
                const currentLink = formSocialLinks.find(l => l.platform === platform)?.url || "";

                return (
                  <div key={platform} className="flex items-center gap-3">
                    <div className="w-8 flex justify-center"><IconComp className="h-5 w-5 text-muted-foreground" /></div>
                    <Input
                      value={currentLink}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSocialLinks(prev => {
                          const exists = prev.find(l => l.platform === platform);
                          if (!val && exists) return prev.filter(l => l.platform !== platform);
                          if (val && exists) return prev.map(l => l.platform === platform ? { ...l, url: val } : l);
                          if (val && !exists) return [...prev, { platform: platform as any, url: val }];
                          return prev;
                        });
                      }}
                      placeholder={`${platform} Profile URL`}
                    />
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </form>
      </ScrollArea>
    </Tabs>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full gap-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage your digital storefronts.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetFormFields(); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]">
              <PlusCircle className="mr-2 h-5 w-5" /> New Store
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl h-[80vh] flex flex-col p-6">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Store</DialogTitle>
              <DialogDescription>Enter your store details below.</DialogDescription>
            </DialogHeader>
            {renderFormContent(handleAddStore)}
            <DialogFooter className="mt-auto pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                const form = document.getElementById('store-form') as HTMLFormElement;
                if (form) form.requestSubmit();
                else handleAddStore(); // Fallback
              }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Store"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview (Optional, can be enhanced with real data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <StoreIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Stores</p>
            <p className="text-2xl font-bold">{stores.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{stores.filter(s => s.status === 'Active').length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-muted/30">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
            <p className="text-2xl font-bold">{stores.length > 0 ? (stores.reduce((acc, s) => acc + s.averageRating, 0) / stores.length).toFixed(1) : "0.0"}</p>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOption} onValueChange={(val: any) => setSortOption(val)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Newest">Newest First</SelectItem>
              <SelectItem value="Oldest">Oldest First</SelectItem>
              <SelectItem value="Name">Name (A-Z)</SelectItem>
              <SelectItem value="Highest Rated">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!authUser ? (
        <Card className="p-8 text-center bg-muted/50 border-dashed">
          <p className="text-muted-foreground mb-4">Please sign in to manage your stores.</p>
          <Button asChild><Link href="/login">Sign In</Link></Button>
        </Card>
      ) : stores.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/30">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <StoreIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Stores Yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Start selling by creating your first store profile. It only takes a minute.</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>Create Your First Store</Button>
        </Card>
      ) : filteredStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Search className="h-12 w-12 mb-4 opacity-20" />
          <p>No stores match your search.</p>
          <Button variant="link" onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}>Clear Filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStores.map(store => (
            <Card key={store.id} className="group overflow-hidden border-0 shadow-md ring-1 ring-border/50 bg-card hover:shadow-xl hover:ring-primary/20 transition-all duration-300">
              {/* Banner Area */}
              <div className="h-32 w-full relative bg-muted/30">
                {store.banner ? (
                  <Image src={store.banner} alt={store.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className={`${storeStatusColors[store.status]} backdrop-blur-sm shadow-sm font-medium border-0`}>
                    {store.status}
                  </Badge>
                </div>
              </div>

              {/* Content Overlap */}
              <div className="px-6 relative">
                <div className="absolute -top-10 left-6 h-20 w-20 rounded-xl bg-background shadow-md overflow-hidden border-2 border-background p-0.5">
                  <div className="relative h-full w-full rounded-lg overflow-hidden bg-muted">
                    {store.logo ? (
                      <Image src={store.logo} alt={store.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10">
                        <StoreIcon className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard?storeId=${store.id}`}><ExternalLink className="mr-2 h-4 w-4" /> Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => prepareFormForEdit(store)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setSelectedStore(store); setIsDeleteDialogOpen(true); }} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="pt-2 pb-6 px-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-lg leading-tight truncate flex-1 flex items-center gap-1.5">
                    {store.name}
                    {store.isVerified && (
                      <Badge variant="secondary" className="h-5 px-1.5 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0" title="Verified Store">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-1 text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                    <span>{store.averageRating > 0 ? store.averageRating.toFixed(1) : "New"}</span>
                    {store.reviewCount > 0 && <span className="text-muted-foreground text-xs font-normal">({store.reviewCount})</span>}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-[2.5em]">{store.description}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {store.categories.slice(0, 3).map((cat, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">
                      <Tag className="mr-1 h-3 w-3" /> {cat}
                    </span>
                  ))}
                  {store.categories.length > 3 && <span className="text-muted-foreground flex items-center">+{store.categories.length - 3}</span>}
                </div>

                <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                  {store.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> <span className="truncate">{store.location}</span></div>}
                  {store.contactPhone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> <span>{store.contactPhone}</span></div>}
                </div>
              </CardContent>

              <CardFooter className="px-6 pb-6 pt-0">
                <Button className="w-full gap-2 shadow-sm" variant="outline" asChild>
                  <Link href={`/settings?storeId=${store.id}`}>
                    Manage Store
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetFormFields(); }}>
        <DialogContent className="sm:max-w-xl h-[80vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
            <DialogDescription>Update the details for {selectedStore?.name}.</DialogDescription>
          </DialogHeader>
          {selectedStore && renderFormContent(handleEditStore)}
          <DialogFooter className="mt-auto pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const form = document.getElementById('store-form') as HTMLFormElement;
              if (form) form.requestSubmit();
              else handleEditStore();
            }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedStore?.name}" and all associated products and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStore} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Store"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
