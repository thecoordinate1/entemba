
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
import { MoreVertical, PlusCircle, Edit, Trash2, Globe, MapPin, Eye } from "lucide-react";
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
import type { Store } from "@/lib/mockData";
import { initialStores, storeStatusColors } from "@/lib/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";


export default function StoresPage() {
  const [stores, setStores] = React.useState<Store[]>(initialStores);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null);
  const { toast } = useToast();

  const handleAddStore = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newStore: Store = {
      id: `store_${Date.now()}`,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      logo: "https://picsum.photos/id/120/200/100", // Placeholder
      dataAiHint: "store generic",
      status: "Inactive",
      domain: formData.get("domain") as string || undefined,
      location: formData.get("location") as string || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setStores([newStore, ...stores]);
    setIsAddDialogOpen(false);
    toast({ title: "Store Created", description: `${newStore.name} has been successfully created.` });
  };

  const handleEditStore = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStore) return;
    const formData = new FormData(event.currentTarget);
    const updatedStore: Store = {
      ...selectedStore,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      domain: formData.get("domain") as string || undefined,
      location: formData.get("location") as string || undefined,
      status: formData.get("status") as Store["status"],
    };
    setStores(stores.map(s => s.id === selectedStore.id ? updatedStore : s));
    // Also update initialStores for persistence across navigations (demo only)
    const storeIndex = initialStores.findIndex(s => s.id === selectedStore.id);
    if (storeIndex !== -1) {
      initialStores[storeIndex] = updatedStore;
    }
    setIsEditDialogOpen(false);
    setSelectedStore(null);
    toast({ title: "Store Updated", description: `${updatedStore.name} has been successfully updated.` });
  };

  const handleDeleteStore = () => {
    if (!selectedStore) return;
    setStores(stores.filter(s => s.id !== selectedStore.id));
     // Also update initialStores (demo only)
    const storeIndex = initialStores.findIndex(s => s.id === selectedStore.id);
    if (storeIndex !== -1) {
      initialStores.splice(storeIndex, 1);
    }
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
            <form onSubmit={handleAddStore} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Store Name</Label>
                <Input id="name" name="name" placeholder="e.g., My Awesome Shop" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="A brief description of your store." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="domain">Domain (Optional)</Label>
                  <Input id="domain" name="domain" placeholder="e.g., myshop.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input id="location" name="location" placeholder="e.g., City, Country" />
                </div>
              </div>
              {/* Logo upload can be added here */}
              <DialogFooter>
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
            <CardContent className="flex-grow space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className={`${storeStatusColors[store.status]} text-xs`}>
                  {store.status}
                </Badge>
                <span>· Created {new Date(store.createdAt).toLocaleDateString()}</span>
              </div>
              {store.domain && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a href={`http://${store.domain}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    {store.domain}
                  </a>
                </div>
              )}
              {store.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{store.location}</span>
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
            <form onSubmit={handleEditStore} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Store Name</Label>
                <Input id="edit-name" name="name" defaultValue={selectedStore.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" name="description" defaultValue={selectedStore.description} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-domain">Domain (Optional)</Label>
                  <Input id="edit-domain" name="domain" defaultValue={selectedStore.domain || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location (Optional)</Label>
                  <Input id="edit-location" name="location" defaultValue={selectedStore.location || ""} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={selectedStore.status}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
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

