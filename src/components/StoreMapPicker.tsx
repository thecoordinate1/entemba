"use client";

import React, { useState, useEffect } from 'react';
import { Map, Marker } from 'pigeon-maps';
import { Loader2, Search, LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const defaultCenter: [number, number] = [-15.3875, 28.3228]; // Lusaka

interface StoreMapPickerProps {
    latitude?: number | null;
    longitude?: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
}

export default function StoreMapPicker({ latitude, longitude, onLocationSelect }: StoreMapPickerProps) {
    const { toast } = useToast();
    const [center, setCenter] = useState<[number, number]>(defaultCenter);
    const [zoom, setZoom] = useState(13);
    const [isMounted, setIsMounted] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [skipNextFetch, setSkipNextFetch] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync center when props change, but only if they are valid
    useEffect(() => {
        if (latitude && longitude) {
            setCenter([latitude, longitude]);
        }
    }, [latitude, longitude]);

    // Debounce effect for search suggestions
    useEffect(() => {
        if (skipNextFetch) {
            setSkipNextFetch(false);
            return;
        }

        const timer = setTimeout(async () => {
            // Clean query: remove multiple spaces, handle CamelCase missing spaces
            const cleanedQuery = searchQuery.trim().replace(/\s+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

            if (cleanedQuery.length > 2) {
                try {
                    // Search with country code preference but not strict restriction to allow close matches
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanedQuery)}&countrycodes=zm&limit=5`, {
                        headers: {
                            'User-Agent': 'EntembaVendorDashboard/1.0'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setSuggestions(data);
                        setShowSuggestions(true);
                    }
                } catch (e) {
                    console.error("Suggestion fetch error", e);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const selectSuggestion = (result: NominatimResult) => {
        const displayName = result.display_name.split(',')[0];
        setSearchQuery(displayName);
        setSkipNextFetch(true); // Don't re-trigger search on selection
        setShowSuggestions(false);

        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);

        setCenter([newLat, newLng]);
        setZoom(18);
        onLocationSelect(newLat, newLng);

        toast({
            title: "Location Found",
            description: `${displayName} (Lat: ${newLat.toFixed(6)}, Lng: ${newLng.toFixed(6)})`,
        });
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        // Normalize the query:
        // 1. Trim whitespace
        // 2. Replace multiple spaces with a single space
        // 3. Insert space between lowercase and uppercase letters (e.g. "LusakaZambia" -> "Lusaka Zambia")
        const cleanedQuery = searchQuery.trim().replace(/\s+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

        setIsSearching(true);
        setShowSuggestions(false);

        try {
            // Priority 1: Search with explicit Zambia suffix using the cleaned query
            let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanedQuery + ", Zambia")}`, {
                headers: { 'User-Agent': 'EntembaVendorDashboard/1.0' }
            });
            let results: NominatimResult[] = await response.json();

            // Priority 2: If no results, try searching within Zambia country code with cleaned query
            if (!results || results.length === 0) {
                response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanedQuery)}&countrycodes=zm`, {
                    headers: { 'User-Agent': 'EntembaVendorDashboard/1.0' }
                });
                results = await response.json();
            }

            if (results && results.length > 0) {
                const result = results[0];
                const newLat = parseFloat(result.lat);
                const newLng = parseFloat(result.lon);

                setCenter([newLat, newLng]);
                setZoom(18);
                onLocationSelect(newLat, newLng);

                toast({
                    title: "Location Found",
                    description: `${result.display_name.split(',')[0]} (Lat: ${newLat.toFixed(6)}, Lng: ${newLng.toFixed(6)})`,
                });
            } else {
                // Priority 3: Fallback to the first autocomplete suggestion if available ("closest place")
                if (suggestions.length > 0) {
                    selectSuggestion(suggestions[0]);
                    toast({
                        title: "Best Match Found",
                        description: `We couldn't find "${searchQuery}", but found a close match.`,
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "No results found",
                        description: "Try selecting a location from the suggestions."
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Search Error",
                description: "Could not search for location. Please try again."
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ variant: "destructive", title: "Geolocation Not Supported" });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // High precision update
                const newLat = latitude;
                const newLng = longitude;

                setCenter([newLat, newLng]);
                setZoom(18); // Zoom in for high accuracy view
                onLocationSelect(newLat, newLng);

                toast({
                    title: "Location Captured",
                    description: `Lat: ${newLat.toFixed(6)}, Lng: ${newLng.toFixed(6)}`
                });
                setIsLocating(false);
            },
            (error) => {
                let errorMessage = "Could not get location.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "Location access was denied. Please enable location permissions.";
                } else if (error.message) {
                    errorMessage = error.message;
                }
                toast({ variant: "destructive", title: "Geolocation Failed", description: errorMessage });
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    if (!isMounted) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-muted rounded-md border">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full rounded-md overflow-hidden border z-0 relative group">
            <div className="absolute top-3 left-3 right-12 z-10 max-w-sm">
                <div className="flex gap-2 items-start">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Search for a location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="bg-background/80 backdrop-blur-sm shadow-sm border-muted-foreground/20 focus-visible:bg-background transition-colors"
                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                            onBlur={() => {
                                // Delay hiding to allow click event on suggestion to fire
                                setTimeout(() => setShowSuggestions(false), 200);
                            }}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-auto py-1">
                                {suggestions.map((result, index) => (
                                    <li
                                        key={index}
                                        className="px-3 py-2 text-sm hover:bg-muted cursor-pointer truncate"
                                        onClick={() => selectSuggestion(result)}
                                        onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                                    >
                                        {result.display_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleSearch()}
                        disabled={isSearching}
                        className="shadow-sm shrink-0"
                    >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <Map
                height={300}
                center={center}
                zoom={zoom}
                dprs={[1, 2]}
                onBoundsChanged={({ center, zoom }) => {
                    setCenter(center);
                    setZoom(zoom);
                }}
                onClick={({ latLng }) => {
                    onLocationSelect(latLng[0], latLng[1]);
                }}
            >
                {latitude && longitude && (
                    <Marker width={50} anchor={[latitude, longitude]} />
                )}
            </Map>
            <div className="absolute bottom-3 right-3 z-10">
                <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating || isSearching}
                    className="shadow-md h-10 w-10 rounded-full bg-background border hover:bg-muted"
                    title="Use Current Location"
                >
                    {isLocating ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <LocateFixed className="h-5 w-5 text-primary" />}
                </Button>
            </div>
        </div>
    );
}
