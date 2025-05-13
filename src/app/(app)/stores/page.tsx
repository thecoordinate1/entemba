
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
import { MoreVertical, PlusCircle, Edit, Trash2, MapPin, Eye, Tag, Instagram, Facebook, Twitter, Link as LinkIcon } from "lucide-react";
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
import type { Store, SocialLink } from "@/lib/mockData";
import { initialStores, storeStatusColors } from "@/lib/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";


const socialIconMap: Record<SocialLink["platform"], LucideIcon> = {
  Instagram: Instagram,
  Facebook: Facebook,
  Twitter: Twitter,
  TikTok: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.47.02-4.8-.73-6.66-2.48-1.85-1.75-2.95-4.02-2.95-6.42 0-2.55 1.28-4.91 3.22-6.49L8.63 9.9c.02-.42.02-.85.02-1.28.02-2.21.02-4.41.02-6.62l2.48-.01c.01.83.01 1.66.01 2.49.01 1.07.01 2.13.01 3.2 0 .39-.03.79-.03 1.18.2-.02.4-.04.6-.05.02-.36.01-.72.02-1.08.01-1.22.01-2.43.01-3.65z"></path></svg>, // Placeholder TikTok Icon
  LinkedIn: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>, // Placeholder LinkedIn Icon
  Other: LinkIcon,
};


export default function StoresPage() {
  const [stores, setStores] = React.useState<Store[]>(initialStores);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const { toast } = useToast();

  const processFormData = (formData: FormData, currentStore?: Store): Omit<Store, "id" | "createdAt" | "logo" | "dataAiHint"> => {
    const socialLinks: SocialLink[] = [];
    const instagramUrl = formData.get("socialInstagram") as string;
    const facebookUrl = formData.get("socialFacebook") as string;
    const twitterUrl = formData.get("socialTwitter") as string;

    if (instagramUrl) socialLinks.push({ platform: "Instagram", url: instagramUrl });
    if (facebookUrl) socialLinks.push({ platform: "Facebook", url: facebookUrl });
    if (twitterUrl) socialLinks.push({ platform: "Twitter", url: twitterUrl });

    return {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      status: formData.get("status") as Store["status"] || (currentStore?.status || "Inactive"),
      location: formData.get("location") as string || undefined,
      socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    };
  };

  const handleAddStore = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const storeData = processFormData(formData);
    const newStore: Store = {
      id: `store_${Date.now()}`,
      ...storeData,
      logo: "https://picsum.photos/id/120/200/100", // Placeholder
      dataAiHint: "store generic",
      createdAt: new Date().toISOString().split("T")[0],
    };
    
    initialStores.unshift(newStore); // For demo persistence
    setStores([newStore, ...stores]);
    setIsAddDialogOpen(false);
    toast({ title: "Store Created", description: `${newStore.name} has been successfully created.` });
  };

  const handleEditStore = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStore) return;
    const formData = new FormData(event.currentTarget);
    const storeData = processFormData(formData, selectedStore);
    const updatedStore: Store = {
      ...selectedStore,
      ...storeData,
    };
    
    const storeIndex = initialStores.findIndex(s => s.id === selectedStore.id);
    if (storeIndex !== -1) { // For demo persistence
      initialStores[storeIndex] = updatedStore;
    }
    setStores(stores.map(s => s.id === selectedStore.id ? updatedStore : s));
    setIsEditDialogOpen(false);
    setSelectedStore(null);
    toast({ title: "Store Updated", description: `${updatedStore.name} has been successfully updated.` });
  };

  const handleDeleteStore = () => {
    if (!selectedStore) return;
    
    const storeIndex = initialStores.findIndex(s => s.id === selectedStore.id);
    if (storeIndex !== -1) { // For demo persistence
      initialStores.splice(storeIndex, 1);
    }
    setStores(stores.filter(s => s.id !== selectedStore.id));
    setIsDeleteDialogOpen(false);
    toast({ title: "Store Deleted", description: `${selectedStore.name} has been successfully deleted.`, variant: "destructive" });
    setSelectedStore(null);
  };

  const openEditDialog = (store: Store) => {
    setSelectedStore(store);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (store: Store) => {
    setSelectedStore(store);
    setIsDeleteDialogOpen(true);
  };

  const renderStoreFormFields = (store?: Store) => {
    const getSocialUrl = (platform: SocialLink["platform"]) => store?.socialLinks?.find(link => link.platform === platform)?.url || "";
    return (
      <>
        <div className="grid gap-2">
          <Label htmlFor="name">Store Name</Label>
          <Input id="name" name="name" defaultValue={store?.name || ""} placeholder="e.g., My Awesome Shop" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={store?.description || ""} placeholder="A brief description of your store." required />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" defaultValue={store?.category || ""} placeholder="e.g., Fashion, Electronics" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input id="location" name="location" defaultValue={store?.location || ""} placeholder="e.g., City, Country" />
            </div>
        </div>
        <Separator className="my-2" />
        <h4 className="text-md font-medium">Social Links (Optional)</h4>
        <div className="grid gap-2">
          <Label htmlFor="socialInstagram">Instagram URL</Label>
          <Input id="socialInstagram" name="socialInstagram" defaultValue={getSocialUrl("Instagram")} placeholder="https://instagram.com/yourstore" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="socialFacebook">Facebook URL</Label>
          <Input id="socialFacebook" name="socialFacebook" defaultValue={getSocialUrl("Facebook")} placeholder="https://facebook.com/yourstore" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="socialTwitter">Twitter/X URL</Label>
          <Input id="socialTwitter" name="socialTwitter" defaultValue={getSocialUrl("Twitter")} placeholder="https://twitter.com/yourstore" />
        </div>
        <Separator className="my-2" />
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={store?.status || "Inactive"}>
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
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Stores</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
            <form onSubmit={handleAddStore} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
              {renderStoreFormFields()}
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Store</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stores.length === 0 && (
         <div className="text-center text-muted-foreground py-10 col-span-full">
          You haven't created any stores yet. Click "Create Store" to get started.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Card key={store.id} className="flex flex-col">
            <CardHeader>
              <Image
                alt={`${store.name} logo`}
                className="aspect-[2/1] w-full rounded-t-md object-cover"
                height={100}
                src={store.logo}
                width={200}
                data-ai-hint={store.dataAiHint}
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
                        <Eye className="mr-2 h-4 w-4" /> View Store Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(store)}>
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
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>{store.category}</span>
                </div>
              {store.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{store.location}</span>
                </div>
              )}
              {store.socialLinks && store.socialLinks.length > 0 && (
                <div className="flex items-center gap-3 pt-1">
                  {store.socialLinks.map(link => {
                    const IconComponent = socialIconMap[link.platform] || LinkIcon;
                    return (
                      <a 
                        key={link.platform} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label={`${store.name} on ${link.platform}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <IconComponent />
                      </a>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter>
               <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard?storeId=${store.id}`}>Manage Store</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Edit Store Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {selectedStore?.name}</DialogTitle>
            <DialogDescription>
              Update your store's details.
            </DialogDescription>
          </DialogHeader>
          {selectedStore && (
            <form onSubmit={handleEditStore} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
              {renderStoreFormFields(selectedStore)}
              <DialogFooter className="pt-4 border-t">
                 <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Store Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the store "{selectedStore?.name}" and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedStore(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStore} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

