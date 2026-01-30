"use client";

import { useEffect, useState } from 'react';
import { getStoreByEmail } from '@/services/storeService';
import { getProductsByStoreId } from '@/services/productService';
import type { ProductFromSupabase } from '@/services/productService';
import type { StoreFromSupabase } from '@/services/storeService';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

const ENTEMBA_SHOP_EMAIL = 'entemba.shop@gmail.com';

export default function ShopPage() {
    const [products, setProducts] = useState<ProductFromSupabase[]>([]);
    const [store, setStore] = useState<StoreFromSupabase | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                // 1. Get Store by Email
                const { data: storeData, error: storeError } = await getStoreByEmail(ENTEMBA_SHOP_EMAIL);

                if (storeError) throw new Error(storeError.message);
                if (!storeData) {
                    setError('Store not found. Please ensure the store contact email is set to entemba.shop@gmail.com');
                    return;
                }
                setStore(storeData);

                // 2. Get Products
                const { data: productsData, error: productsError } = await getProductsByStoreId(storeData.id, 1, 100);
                if (productsError) throw new Error(productsError.message);

                setProducts(productsData || []);
            } catch (err: any) {
                setError(err.message || 'Failed to load shop.');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold text-red-500">Error</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {store?.logo_url ? (
                            <Image
                                src={store.logo_url}
                                alt={store.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                {store?.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{store?.name}</h1>
                            <p className="text-sm text-gray-500">{store?.description || 'Welcome to our shop!'}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {products.length === 0 ? (
                    <div className="text-center py-12">
                        <h2 className="text-xl text-gray-500">No products available yet.</h2>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => {
                            // Commission assumption: Stored in attributes or 10% defaults?
                            // The user didn't specify, so I will check attributes for 'commission' or default to 0.
                            const commission = product.attributes?.commission || 0;

                            return (
                                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                    <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
                                        {product.product_images?.[0]?.image_url ? (
                                            <Image
                                                src={product.product_images[0].image_url}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 space-y-2">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1" title={product.name}>
                                            {product.name}
                                        </h3>

                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-gray-500 text-sm">Best Selling Price:</span>
                                                <span className="text-lg font-bold text-primary">
                                                    {formatCurrency(product.price)}
                                                </span>
                                            </div>

                                            {commission > 0 && (
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-green-600 text-sm font-medium">Commission:</span>
                                                    <span className="text-green-600 font-bold">
                                                        {formatCurrency(Number(commission))}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Fallback if no specific commission is set, maybe show nothing or generic message? 
                            User asked to show it, so if 0 maybe show "N/A" or hide. Hiding for now if 0. 
                        */}
                                        </div>

                                        <button className="w-full mt-4 bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
