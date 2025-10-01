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
import { MoreVertical, PlusCircle, Edit, Trash2, MapPin, Eye, Tag, Instagram, Facebook, Twitter, Link as LinkIconLucide, UploadCloud, ExternalLink } from "lucide-react";
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

interface ImageSlot {
  file: File | null;
  previewUrl: string | null;
  dataUri: string | null; 
}

const initialLogoSlot = (): ImageSlot => ({
  file: null,
  previewUrl: null,
  dataUri: null,
});

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const socialIconMap: Record<string, React.ElementType> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Twitter: Twitter,
  TikTok: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.47.02-4.8-.73-6.66-2.48-1.85-1.75-2.95-4.02-2.95-6.42 0-2.55 1.28-4.91 3.22-6.49L8.63 9.9c.02-.42.02-.85.02-1.28.02-2.21.02-4.41.02-6.62l2.48-.01c.01.83.01 1.66.01 2.49.01 1.07.01 2.13.01 3.2 0 .39-.03.79-.03 1.18.2-.02.4-.04.6-.05.02-.36.01-.72.02-1.08.01-1.22.01-2.43.01-3.65z"></path></svg>, 
  LinkedIn: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>,
  Other: LinkIconLucide,
};

// Helper to map StoreFromSupabase to MockStoreType for UI compatibility
const mapStoreFromSupabaseToMockStore = (store: StoreFromSupabase): MockStoreType => ({
  id: store.id,
  name: store.name,
  description: store.description,
  logo: store.logo_url || "https://placehold.co/200x100.png?text=No+Logo",
  status: store.status as MockStoreType["status"], // Assuming status values are compatible
  categories: store.categories || [],
  socialLinks: store.social_links.map(sl => ({ platform: sl.platform as MockSocialLinkType["platform"], url: sl.url })),
  location: store.location || undefined,
  pickupLatitude: store.pickup_latitude || undefined,
  pickupLongitude: store.pickup_longitude || undefined,
  createdAt: new Date(store.created_at).toISOString().split("T")[0],
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
  
  const [formLogoSlot, setFormLogoSlot] = React.useState<ImageSlot>(initialLogoSlot());
  const [formStoreName, setFormStoreName] = React.useState("");
  const [formStoreDescription, setFormStoreDescription] = React.useState("");
  const [formStoreCategories, setFormStoreCategories] = React.useState<string>("");
  const [formStoreLocation, setFormStoreLocation] = React.useState("");
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
          const mappedStores: MockStoreType[] = userStoresFromSupabase.map(mapStoreFromSupabaseToMockStore);
          setStores(mappedStores);
        }
      } else {
        setStores([]); 
      }
      setIsLoading(false);
    };
    getUserAndStores();
  }, [supabase, toast]);


  const resetLogoSlot = () => {
    if (formLogoSlot.previewUrl && formLogoSlot.file) URL.revokeObjectURL(formLogoSlot.previewUrl);
    setFormLogoSlot(initialLogoSlot());
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFormLogoSlot(prevSlot => {
      const newSlot = { ...prevSlot };
      if (newSlot.previewUrl && newSlot.file) URL.revokeObjectURL(newSlot.previewUrl);

      if (file) {
        newSlot.file = file;
        newSlot.previewUrl = URL.createObjectURL(file);
        newSlot.dataUri = null; 
      } else {
        newSlot.file = null;
        newSlot.previewUrl = newSlot.dataUri ? newSlot.dataUri : null; 
      }
      return newSlot;
    });
  };

  const prepareFormForEdit = (store: MockStoreType) => {
    setSelectedStore(store);
    setFormStoreName(store.name);
    setFormStoreDescription(store.description);
    setFormStoreCategories(store.categories.join(", "));
    setFormStoreLocation(store.location || "");
    setFormStorePickupLat(store.pickupLatitude || "");
    setFormStorePickupLng(store.pickupLongitude || "");
    setFormStoreStatus(store.status);
    setFormSocialLinks(store.socialLinks?.map(sl => ({ platform: sl.platform, url: sl.url })) || []);
    setFormLogoSlot({
      file: null,
      previewUrl: store.logo,
      dataUri: store.logo, // Keep original URL if no new file
    });
    setIsEditDialogOpen(true);
  };
  
  const resetFormFields = () => {
    setFormStoreName("");
    setFormStoreDescription("");
    setFormStoreCategories("");
    setFormStoreLocation("");
    setFormStorePickupLat("");
    setFormStorePickupLng("");
    setFormStoreStatus("Inactive");
    setFormSocialLinks([]);
    resetLogoSlot();
  };

  const processAndValidateFormData = (): StorePayload | null => {
    const categoriesArray = formStoreCategories.split(',').map(c => c.trim()).filter(Boolean);

    if (!formStoreName || !formStoreDescription || categoriesArray.length === 0) {
        toast({variant: "destructive", title: "Missing Fields", description: "Name, Description, and at least one Category are required."});
        return null;
    }

    return {
      name: formStoreName,
      description: formStoreDescription,
      logo_url: formLogoSlot.dataUri, 
      categories: categoriesArray,
      status: formStoreStatus,
      location: formStoreLocation || null,
      pickup_latitude: formStorePickupLat ? parseFloat(String(formStorePickupLat)) : null,
      pickup_longitude: formStorePickupLng ? parseFloat(String(formStorePickupLng)) : null,
      social_links: formSocialLinks.filter(link => link.url.trim() !== ''),
    };
  };


  const handleAddStore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a store." });
      return;
    }
    setIsSubmitting(true);
    try {
      const storePayload = processAndValidateFormData();
      if (!storePayload) {
          setIsSubmitting(false);
          return;
      }

      const { data: newStoreFromBackend, error } = await createStore(authUser.id, storePayload, formLogoSlot.file);
      
      if (error) {
        console.error("Error from createStore service:", error.message, (error as any).details);
        toast({ variant: "destructive", title: "Error Creating Store", description: error.message || "An unexpected error occurred." });
        setIsSubmitting(false);
        return;
      }

      if (newStoreFromBackend) {
        const newStoreMapped = mapStoreFromSupabaseToMockStore(newStoreFromBackend);
        setStores(prevStores => [newStoreMapped, ...prevStores]);
        toast({ title: "Store Created", description: `${newStoreMapped.name} has been successfully created.` });
        setIsAddDialogOpen(false);
        resetFormFields();
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not create store. Received no data from backend." });
      }
    } catch (error) {
      console.error("Failed to add store (catch block):", error);
      if (error instanceof Error) {
        toast({ variant: "destructive", title: "Error Creating Store", description: error.message });
      } else {
        toast({ variant: "destructive", title: "Error", description: "An unknown error occurred while creating the store." });
      }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEditStore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStore || !authUser) {
        toast({variant: "destructive", title: "Error", description: "No store selected or user not authenticated."});
        return;
    }
    setIsSubmitting(true);
    try {
        const storePayload = processAndValidateFormData();
        if (!storePayload) {
            setIsSubmitting(false);
            return;
        }
        
        const payloadForUpdate: StorePayload = {
            ...storePayload,
            logo_url: formLogoSlot.file ? undefined : formLogoSlot.dataUri,
        };

        const { data: updatedStoreFromBackend, error } = await updateStore(selectedStore.id, authUser.id, payloadForUpdate, formLogoSlot.file);
        
        if (error) {
            console.error("Error from updateStore service:", error.message, (error as any).details);
            toast({ variant: "destructive", title: "Error Updating Store", description: error.message || "An unexpected error occurred." });
            setIsSubmitting(false);
            return;
        }

        if (updatedStoreFromBackend) {
            const updatedStoreMapped = mapStoreFromSupabaseToMockStore(updatedStoreFromBackend);
            setStores(prevStores => prevStores.map(s => s.id === selectedStore.id ? updatedStoreMapped : s));
            toast({ title: "Store Updated", description: `${updatedStoreMapped.name} has been successfully updated.` });
            setIsEditDialogOpen(false);
            setSelectedStore(null);
            resetFormFields();
        } else {
            toast({ variant: "destructive", title: "Error", description: "Could not update store. Received no data from backend." });
        }
    } catch (error) {
      console.error("Failed to edit store (catch block):", error);
       if (error instanceof Error) {
        toast({ variant: "destructive", title: "Error Updating Store", description: error.message });
      } else {
        toast({ variant: "destructive", title: "Error", description: "An unknown error occurred while updating the store." });
      }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!selectedStore || !authUser) return;
    setIsSubmitting(true);
    try {
        const { error } = await deleteStore(selectedStore.id, authUser.id);
        if (error) {
             console.error("Error from deleteStore service:", error.message, (error as any).details);
            toast({ variant: "destructive", title: "Error Deleting Store", description: error.message || "An unexpected error occurred." });
        } else {
            setStores(prevStores => prevStores.filter(s => s.id !== selectedStore!.id));
            toast({ title: "Store Deleted", description: `${selectedStore.name} has been successfully deleted.`, variant: "default" }); // Use default for success
        }
        setIsDeleteDialogOpen(false);
        setSelectedStore(null);
    } catch (error) {
        console.error("Failed to delete store (catch block):", error);
        toast({ variant: "destructive", title: "Error Deleting Store", description: "An unexpected error occurred."});
    } finally {
        setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (store: MockStoreType) => {
    setSelectedStore(store);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSocialLinkChange = (platform: StoreSocialLinkPayload["platform"], url: string) => {
    setFormSocialLinks(prevLinks => {
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

  const getSocialUrl = (platform: StoreSocialLinkPayload["platform"]) => formSocialLinks.find(link => link.platform === platform)?.url || "";

  const renderStoreFormFields = () => {
    return (
      <>
        <div className="grid gap-2">
          <Label htmlFor="logoFile">Store Logo</Label>
          <Input 
            id="logoFile" 
            name="logoFile" 
            type="file" 
            accept="image/*" 
            onChange={handleLogoFileChange}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
        {formLogoSlot.previewUrl ? (
          <div className="mt-2 flex justify-center">
            <Image
              src={formLogoSlot.previewUrl}
              alt="Logo preview"
              width={128}
              height={128}
              className="rounded-md object-contain h-32 w-32 border"
              unoptimized={formLogoSlot.previewUrl?.startsWith('blob:')}
            />
          </div>
        ) : (
          <div className="mt-2 flex justify-center h-32 w-32 rounded-md border bg-muted items-center">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Separator className="my-2" />
        <div className="grid gap-2">
          <Label htmlFor="name">Store Name</Label>
          <Input id="name" name="name" value={formStoreName} onChange={e => setFormStoreName(e.target.value)} placeholder="e.g., My Awesome Shop" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" value={formStoreDescription} onChange={e => setFormStoreDescription(e.target.value)} placeholder="A brief description of your store." required />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="categories">Categories (comma-separated)</Label>
                <Input 
                  id="categories" 
                  name="categories" 
                  value={formStoreCategories}
                  onChange={e => setFormStoreCategories(e.target.value)} 
                  placeholder="e.g., Fashion, Electronics" 
                  required 
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="location">Default Pickup Address</Label>
                <Input id="location" name="location" value={formStoreLocation} onChange={e => setFormStoreLocation(e.target.value)} placeholder="e.g., 123 Main St, Lusaka" />
            </div>
        </div>
        <Separator className="my-2" />
        <h4 className="text-md font-medium">Social Links (Optional)</h4>
        {(["Instagram", "Facebook", "Twitter", "TikTok", "LinkedIn", "Other"] as const).map((platform) => {
            const IconComp = socialIconMap[platform as MockSocialLinkType["platform"]] || LinkIconLucide;
            return (
            <div key={platform} className="grid gap-2">
                <Label htmlFor={`social${platform}`} className="flex items-center"><IconComp className="mr-2 h-4 w-4 text-muted-foreground"/> {platform} URL</Label>
                <Input 
                    id={`social${platform}`} 
                    name={`social${platform}`}
                    value={getSocialUrl(platform)} 
                    onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                    placeholder={`https://${platform.toLowerCase().replace(/\s+/g, '')}.com/yourstore`}
                />
            </div>
            );
        })}
        <Separator className="my-2" />
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" value={formStoreStatus} onValueChange={(value: StoreStatus) => setFormStoreStatus(value)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  };
  
  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Your Stores</h1>
                <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Create Store</Button>
            </div>
            <div className="text-center py-10 text-muted-foreground">Loading your stores...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Stores</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { setIsAddDialogOpen(isOpen); if (!isOpen) resetFormFields();}}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedStore(null); resetFormFields(); setIsAddDialogOpen(true); }} disabled={!authUser}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Store
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Store</DialogTitle>
              <DialogDescription>
                Set up your new storefront. You can customize it further later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStore}>
                <ScrollArea className="h-[70vh] pr-3">
                    <div className="grid gap-4 py-4">
                        {renderStoreFormFields()}
                    </div>
                </ScrollArea>
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {setIsAddDialogOpen(false); resetFormFields();}}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !authUser}>{isSubmitting ? "Creating..." : "Create Store"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!authUser && !isLoading && (
        <div className="text-center text-muted-foreground py-10 col-span-full">
            Please <Link href="/login" className="text-primary hover:underline">sign in</Link> to manage your stores.
        </div>
      )}

      {authUser && stores.length === 0 && !isLoading && (
         <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 col-span-full">
            <p className="mb-4">You haven't created any stores yet.</p>
            <Button onClick={() => { setSelectedStore(null); resetFormFields(); setIsAddDialogOpen(true); }} disabled={!authUser}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Store
            </Button>
        </div>
      )}

      {authUser && stores.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
            <Card key={store.id} className="flex flex-col">
                <CardHeader>
                <Image
                    alt={`${store.name} logo`}
                    className="aspect-[2/1] w-full rounded-t-md object-cover border"
                    height={100}
                    src={store.logo || "https://placehold.co/200x100.png?text=No+Logo"}
                    width={200}
                    unoptimized={store.logo?.startsWith('blob:')} 
                />
                <div className="pt-4 flex items-center justify-between">
                    <CardTitle className="text-xl">{store.name}</CardTitle>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">Store actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                        <Link href={`/dashboard?storeId=${store.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" /> View Store Dashboard
                        </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => prepareFormForEdit(store)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDeleteDialog(store)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Store
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2">{store.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className={`${storeStatusColors[store.status]} text-xs`}>
                    {store.status}
                    </Badge>
                    <span>· Created {new Date(store.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <Tag className="mr-1 h-4 w-4" />
                    {store.categories.map(cat => <Badge variant="secondary" key={cat}>{cat}</Badge>)}
                </div>
                {store.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{store.location}</span>
                    </div>
                )}
                {store.socialLinks && store.socialLinks.length > 0 && (
                    <div className="flex items-center gap-3 pt-1">
                    {store.socialLinks.map(link => {
                        const IconComponent = socialIconMap[link.platform as MockSocialLinkType["platform"]] || LinkIconLucide;
                        return (
                        <a 
                            key={link.platform} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            aria-label={`${store.name} on ${link.platform}`}
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            <IconComponent className="h-4 w-4"/>
                        </a>
                        );
                    })}
                    </div>
                )}
                </CardContent>
                <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                    <Link href={`/settings?storeId=${store.id}`}>Manage Store</Link>
                </Button>
                </CardFooter>
            </Card>
            ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {setIsEditDialogOpen(isOpen); if(!isOpen) resetFormFields();}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {selectedStore?.name}</DialogTitle>
            <DialogDescription>
              Update your store's details.
            </DialogDescription>
          </DialogHeader>
          {selectedStore && (
            <form onSubmit={handleEditStore}>
                <ScrollArea className="h-[70vh] pr-3">
                    <div className="grid gap-4 py-4">
                        {renderStoreFormFields()}
                    </div>
                </ScrollArea>
              <DialogFooter className="pt-4 border-t">
                 <Button type="button" variant="outline" onClick={() => {setIsEditDialogOpen(false); resetFormFields();}}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !authUser}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the store "{selectedStore?.name}" and all its associated data (products, orders, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedStore(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStore} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Store"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
