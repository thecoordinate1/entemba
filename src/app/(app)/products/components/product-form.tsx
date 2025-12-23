"use client";

import * as React from "react";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UploadCloud, X, Plus, Trash2, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { type ProductPayload, type ProductFromSupabase } from "@/services/productService";

// --- Schema Definition ---

const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    category: z.string().min(1, "Category is required"),
    price: z.coerce.number().min(0, "Price must be positive"),
    order_price: z.coerce.number().optional().nullable(),
    stock: z.coerce.number().int().min(0, "Stock must be a positive integer"),
    sku: z.string().optional().nullable(),
    status: z.enum(["Active", "Draft", "Archived"]),
    description: z.string().optional().nullable(),
    full_description: z.string().min(10, "Full description helps SEO and must be at least 10 chars"),
    tags: z.array(z.string()).optional(),

    // Shipping
    weight_kg: z.coerce.number().optional().nullable(),
    dimensions_length: z.coerce.number().optional().nullable(),
    dimensions_width: z.coerce.number().optional().nullable(),
    dimensions_height: z.coerce.number().optional().nullable(),

    // Dynamic Attributes (Stored as flat fields in form, constructed into object on submit)
    attr_condition: z.string().optional(),
    attr_brand: z.string().optional(),
    attr_model: z.string().optional(),
    attr_year: z.string().optional(),
    attr_material: z.string().optional(),
    attr_color: z.string().optional(),
    attr_size: z.string().optional(),
    attr_gender: z.string().optional(),
    attr_type: z.string().optional(),
    attr_team: z.string().optional(),
    attr_season: z.string().optional(),
    attr_mileage: z.string().optional(),
    attr_fuelType: z.string().optional(),
    // ... add other common ones as needed, or use a dynamic record approach.
    // For simplicity and type safety with existing UI logic, we'll map a few common ones strictly
    // and maybe allow a generic "attributes" json field if needed, but the previous UI had specific fields.
    attributes: z.record(z.any()).optional(), // Catch-all for extra logic
    is_dropshippable: z.boolean().default(false),
    supplier_price: z.coerce.number().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    initialData?: ProductFromSupabase | null;
    onSubmit: (data: ProductFormValues, images: { file: File | null; id?: string; preview: string; order: number }[]) => Promise<void>;
    isSubmitting: boolean;
    onCancel: () => void;
    isSupplier?: boolean;
}

const CATEGORIES = [
    { value: "auto-parts", label: "Auto Parts" },
    { value: "jerseys", label: "Jerseys" },
    { value: "apparel", label: "Apparel & Fashion" },
    { value: "shoes", label: "Shoes & Footwear" },
    { value: "electronics", label: "Electronics & Gadgets" },
    { value: "home-garden", label: "Home & Garden" },
    { value: "beauty-personal-care", label: "Beauty & Personal Care" },
    { value: "health-wellness", label: "Health & Wellness" },
    { value: "toys-games", label: "Toys & Games" },
    { value: "books-media", label: "Books, Movies & Music" },
    { value: "sports-outdoors", label: "Sports & Outdoors" },
    { value: "vehicles", label: "Vehicles" },
    { value: "real-estate", label: "Real Estate" },
    { value: "art-collectibles", label: "Art & Collectibles" },
    { value: "jewelry-watches", label: "Jewelry & Watches" },
    { value: "baby-kids", label: "Baby & Kids" },
    { value: "pet-supplies", label: "Pet Supplies" },
    { value: "food-beverages", label: "Food & Beverages" },
    { value: "musical-instruments", label: "Musical Instruments" },
    { value: "services", label: "Services" },
    { value: "other", label: "Other" },
];

export function ProductForm({ initialData, onSubmit, isSubmitting, onCancel, isSupplier }: ProductFormProps) {
    const { toast } = useToast();

    // --- Image State ---
    // Managed separately from RHF for simpler file handling logic
    const [images, setImages] = React.useState<{ file: File | null; id?: string; preview: string; order: number }[]>([]);

    React.useEffect(() => {
        if (initialData?.product_images) {
            const existingImages = initialData.product_images.sort((a, b) => a.order - b.order).map(img => ({
                file: null,
                id: img.id,
                preview: img.image_url,
                order: img.order
            }));
            setImages(existingImages);
        }
    }, [initialData]);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || "",
            category: initialData?.category || "",
            price: initialData?.price || 0,
            order_price: initialData?.order_price || null,
            stock: initialData?.stock || 0,
            sku: initialData?.sku || "",
            status: (initialData?.status as any) || "Draft",
            description: initialData?.description || "",
            full_description: initialData?.full_description || "",
            tags: initialData?.tags || [],
            weight_kg: initialData?.weight_kg || null,
            dimensions_length: initialData?.dimensions_cm?.length || null,
            dimensions_width: initialData?.dimensions_cm?.width || null,
            dimensions_height: initialData?.dimensions_cm?.height || null,

            // Map attributes flat
            attr_condition: initialData?.attributes?.condition || "",
            attr_brand: initialData?.attributes?.brand || "",
            attr_model: initialData?.attributes?.model || "",
            attr_year: initialData?.attributes?.year || "",
            attr_material: initialData?.attributes?.material || "",
            attr_color: initialData?.attributes?.color || "",
            attr_size: initialData?.attributes?.size || "",
            attr_gender: initialData?.attributes?.gender || "",
            attr_type: initialData?.attributes?.type || "",
            attr_team: initialData?.attributes?.team || "",
            attr_season: initialData?.attributes?.season || "",
            attr_fuelType: initialData?.attributes?.fuelType || "",
            is_dropshippable: !!initialData?.is_dropshippable,
            supplier_price: initialData?.supplier_price || null,
        },
    });

    const category = form.watch("category");

    // --- Handlers ---

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages = files.map((file, i) => ({
            file,
            preview: URL.createObjectURL(file),
            order: images.length + i
        }));

        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            const removed = newImages.splice(index, 1)[0];
            if (removed.file && removed.preview) URL.revokeObjectURL(removed.preview);
            return newImages.map((img, i) => ({ ...img, order: i })); // Reorder
        });
    };

    const handleFormSubmit = async (values: ProductFormValues) => {
        // Construct the attributes object dynamically before submitting
        const {
            attr_condition, attr_brand, attr_model, attr_year, attr_material,
            attr_color, attr_size, attr_gender, attr_type,
            attr_team, attr_season, attr_mileage, attr_fuelType,
            ...rest
        } = values;

        // Helper to add only if truthy
        const attrs: Record<string, any> = {
            ...(values.attributes || {}),
        };
        if (attr_condition) attrs.condition = attr_condition;
        if (attr_brand) attrs.brand = attr_brand;
        if (attr_model) attrs.model = attr_model;
        if (attr_year) attrs.year = attr_year;
        if (attr_material) attrs.material = attr_material;
        if (attr_color) attrs.color = attr_color;
        if (attr_size) attrs.size = attr_size;
        if (attr_gender) attrs.gender = attr_gender;
        if (attr_type) attrs.type = attr_type;
        if (attr_team) attrs.team = attr_team;
        if (attr_season) attrs.season = attr_season;
        if (attr_mileage) attrs.mileage = attr_mileage;
        if (attr_fuelType) attrs.fuelType = attr_fuelType;

        // Clean up temporary flat fields from the payload actually sent?
        // The `values` object still has them, but we pass `values` to the parent.
        // We should modify `values.attributes` with our constructed object.
        values.attributes = attrs;

        await onSubmit(values, images);
    };

    // Tag handling
    const [tagInput, setTagInput] = React.useState("");
    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim()) {
                const currentTags = form.getValues('tags') || [];
                if (!currentTags.includes(tagInput.trim())) {
                    form.setValue('tags', [...currentTags, tagInput.trim()]);
                }
                setTagInput("");
            }
        }
    };
    const removeTag = (tagToRemove: string) => {
        const currentTags = form.getValues('tags') || [];
        form.setValue('tags', currentTags.filter(t => t !== tagToRemove));
    };


    const onInvalid = (errors: FieldErrors<ProductFormValues>) => {
        console.log("Form errors:", errors);
        const firstErrorKey = Object.keys(errors)[0];
        toast({
            variant: "destructive",
            title: "Please check your input",
            description: `Fix the error in ${firstErrorKey} and other fields before saving.`
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit, onInvalid)} className="space-y-8 pb-10">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Details</CardTitle>
                                <CardDescription>Basic information about your product.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Vintage Leather Jacket" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {CATEGORIES.map(cat => (
                                                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price (ZMW)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="order_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Order Price (ZMW)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} value={field.value || ""} placeholder="Cost price" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Short Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Brief summary for list views..."
                                                    className="h-20 resize-none"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="full_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Detailed product information..."
                                                    className="h-32"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Media</CardTitle>
                                <CardDescription>Upload up to 5 images. The first image will be used as the cover.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                            <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            {idx === 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1 font-medium backdrop-blur-sm">
                                                    Main Image
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {images.length < 5 && (
                                        <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                                            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                            <span className="text-xs text-muted-foreground font-medium">Upload</span>
                                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                                        </label>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Specifics & Attributes</CardTitle>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 gap-4">
                                {/* Common Dynamic Fields - Conditional Rendering */}
                                <FormField control={form.control} name="attr_brand" render={({ field }) => (
                                    <FormItem><FormLabel>Brand</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="attr_condition" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Condition</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="New">New</SelectItem>
                                                <SelectItem value="Used">Used</SelectItem>
                                                <SelectItem value="Refurbished">Refurbished</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />

                                {(category === 'apparel' || category === 'shoes' || category === 'jerseys') && (
                                    <>
                                        <FormField control={form.control} name="attr_size" render={({ field }) => (
                                            <FormItem><FormLabel>Size</FormLabel><FormControl><Input placeholder="S, M, L, XL..." {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="attr_color" render={({ field }) => (
                                            <FormItem><FormLabel>Color</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="attr_material" render={({ field }) => (
                                            <FormItem><FormLabel>Material</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="attr_gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Unisex">Unisex</SelectItem>
                                                        <SelectItem value="Men">Men</SelectItem>
                                                        <SelectItem value="Women">Women</SelectItem>
                                                        <SelectItem value="Kids">Kids</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    </>
                                )}

                                {category === 'jerseys' && (
                                    <>
                                        <FormField control={form.control} name="attr_team" render={({ field }) => (
                                            <FormItem><FormLabel>Team</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="attr_season" render={({ field }) => (
                                            <FormItem><FormLabel>Season</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                    </>
                                )}

                                {(category === 'electronics' || category === 'auto-parts' || category === 'vehicles') && (
                                    <FormField control={form.control} name="attr_model" render={({ field }) => (
                                        <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                )}

                                {(category === 'auto-parts' || category === 'vehicles') && (
                                    <FormField control={form.control} name="attr_year" render={({ field }) => (
                                        <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )} />
                                )}

                                {category === 'vehicles' && (
                                    <>
                                        <FormField control={form.control} name="attr_mileage" render={({ field }) => (
                                            <FormItem><FormLabel>Mileage</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="attr_fuelType" render={({ field }) => (
                                            <FormItem><FormLabel>Fuel Type</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                    </>
                                )}

                                {/* Fallback for generic inputs if category demands them - kept simple for now */}
                            </CardContent>
                        </Card>

                    </div>

                    {/* RIGHT COLUMN: Status, Inventory, etc. */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Draft">Draft</SelectItem>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Archived">Archived</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Inventory</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Keywords</CardTitle>
                                <CardDescription>Press Enter to add tags.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(form.watch('tags') || []).map(tag => (
                                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                                            {tag} <X className="h-3 w-3 ml-1" />
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Add tag..."
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="weight_kg"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Weight (kg)</FormLabel>
                                            <FormControl><Input type="number" step="0.1" {...field} value={field.value || ""} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <FormField control={form.control} name="dimensions_length" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Len (cm)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ""} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="dimensions_width" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Wid (cm)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ""} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="dimensions_height" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Hgt (cm)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ""} /></FormControl></FormItem>
                                    )} />
                                </div>
                            </CardContent>
                        </Card>

                        {isSupplier && !initialData?.supplier_product_id && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dropshipping</CardTitle>
                                    <CardDescription>Make this product available for other vendors to sell.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="is_dropshippable"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Available for Dropshipping</FormLabel>
                                                    <FormDescription>
                                                        Allow approved vendors to import this product.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        // @ts-ignore
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch('is_dropshippable') && (
                                        <FormField
                                            control={form.control}
                                            name="supplier_price"
                                            render={({ field }) => (
                                                <FormItem className="mt-4">
                                                    <FormLabel>Wholesale Price (ZMW)</FormLabel>
                                                    <FormDescription>The price other vendors will see and pay.</FormDescription>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/80 backdrop-blur-md flex items-center justify-end gap-3 z-50 md:pl-72">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Saving..." : "Save Product"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
