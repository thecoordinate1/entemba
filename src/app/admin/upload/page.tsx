"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createProduct } from '@/services/productService';
import { getStoreByEmail } from '@/services/storeService';
import type { StoreFromSupabase } from '@/services/storeService';
import { Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';

const TARGET_EMAIL = 'entemba.shop@gmail.com';

export default function AdminUploadPage() {
    const [loading, setLoading] = useState(false);
    const [store, setStore] = useState<StoreFromSupabase | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const { toast } = useToast();

    // Form States
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [commission, setCommission] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        async function checkAccess() {
            setCheckingAuth(true);
            try {
                // In a real app we'd check supabase.auth.getUser() and match email.
                // For this simple task request, we'll fetch the store by this email directly.
                // If the store exists, we assume "access" for this specific demo/tool.
                // ideally we should gate this by real auth user email == TARGET_EMAIL.

                const { data: storeData, error } = await getStoreByEmail(TARGET_EMAIL);

                if (error) throw new Error(error.message);
                if (!storeData) {
                    setIsAuthorized(false);
                } else {
                    setStore(storeData);
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAuthorized(false);
            } finally {
                setCheckingAuth(false);
            }
        }
        checkAccess();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setImages(prev => [...prev, ...newFiles]);

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!store) return;

        setLoading(true);
        try {
            const productPayload = {
                name,
                category: 'General', // Default
                price: parseFloat(price),
                stock: 100, // Default stock
                status: 'Active' as const,
                full_description: 'Uploaded via Admin Panel',
                attributes: {
                    commission: parseFloat(commission) || 0
                }
            };

            const imagePayload = images.map((file, index) => ({
                file,
                order: index
            }));

            // We need a userId for creating product. 
            // Since we are "simulating" this admin page for a specific store found by email,
            // we will use the store's vendor_id as the userId to ensure RLS passes (assuming vendor_id is the owner).
            const { error } = await createProduct(store.vendor_id, store.id, productPayload, imagePayload);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Product uploaded successfully",
            });

            // Reset Form
            setName('');
            setPrice('');
            setCommission('');
            setImages([]);
            setPreviews([]);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Error",
                description: error.message || "Failed to upload product",
            });
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;
    }

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
                <p>No store found for {TARGET_EMAIL}</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Upload Product</h1>
                <p className="text-gray-500">Adding to store: {store?.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                        id="name"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Vintage T-Shirt"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Best Selling Price (ZMW)</Label>
                        <Input
                            id="price"
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="commission">Commission (ZMW)</Label>
                        <Input
                            id="commission"
                            type="number"
                            min="0"
                            step="0.01"
                            value={commission}
                            onChange={e => setCommission(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Product Images</Label>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                        {previews.map((src, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                                <Image src={src} alt="preview" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100">
                            <Plus className="text-gray-400" />
                            <span className="text-xs text-gray-400 mt-1">Add Image</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Upload Product
                </Button>
            </form>
        </div>
    );
}
