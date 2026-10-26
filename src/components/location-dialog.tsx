
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Save, X, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { searchLocations, type SearchResult } from '@/lib/location';

interface LocationDialogProps {
  children: React.ReactNode;
  onLocationUpdate: (position: GeolocationPosition, name?: string) => Promise<void>;
  onManualLocationSubmit: (address: string, name?: string) => Promise<void>;
  allowSave?: boolean;
}

export function LocationDialog({ children, onLocationUpdate, onManualLocationSubmit, allowSave = false }: LocationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [locationName, setLocationName] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search for autocomplete
  const debouncedSearch = useCallback(
    (value: string) => {
      const timeoutId = setTimeout(async () => {
        if (value.trim().length < 3) {
          setSuggestions([]);
          return;
        }
        setIsSearching(true);
        try {
          const results = await searchLocations(value);
          setSuggestions(results);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Search failed:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    []
  );

  useEffect(() => {
    if (showManual) {
      debouncedSearch(manualAddress);
    } else {
      setSuggestions([]);
    }
    return () => setSuggestions([]);
  }, [manualAddress, showManual, debouncedSearch]);

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation Not Supported',
        description: 'Your browser does not support location services.',
      });
      return;
    }

    setIsFetching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nameToSave = allowSave && locationName.trim() ? locationName.trim() : undefined;
        try {
          await onLocationUpdate(position, nameToSave);
          toast({ title: 'Location Updated!', description: nameToSave ? `Saved "${nameToSave}" and updated location.` : 'Your location has been updated automatically.' });
          setOpen(false);
        } catch (error) {
          console.error('Location update failed:', error);
          toast({ variant: 'destructive', title: 'Location Update Failed', description: 'Could not save this location. Please try again.' });
        } finally {
          setIsFetching(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsFetching(false);
        toast({
          variant: 'destructive',
          title: 'Location Access Denied',
          description: 'Please enable location permissions in your browser settings.',
        });
        setShowManual(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    const displayName = suggestion.display_name;
    setManualAddress(displayName);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(manualAddress.trim() === '') {
          toast({ variant: 'destructive', title: 'Invalid Address', description: 'Please enter a valid address.' });
          return;
      }

      const nameToSave = allowSave && locationName.trim() ? locationName.trim() : undefined;
      setIsFetching(true);
      try {
        await onManualLocationSubmit(manualAddress.trim(), nameToSave);
        toast({ title: 'Location Updated!', description: nameToSave ? `Saved "${nameToSave}" and set location.` : 'Your location has been updated.' });
        setOpen(false);
      } catch (error) {
        console.error('Manual location update failed:', error);
        toast({ variant: 'destructive', title: 'Location Update Failed', description: 'Could not save this location. Please try again.' });
      } finally {
        setIsFetching(false);
      }
  }

  const resetState = () => {
    setShowManual(false);
    setIsFetching(false);
    setManualAddress('');
    setLocationName('');
    setSuggestions([]);
    setSelectedIndex(-1);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            setTimeout(resetState, 300);
        }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          if (isFetching) {
              e.preventDefault();
          }
      }}>
        <DialogHeader>
          <DialogTitle>{allowSave ? 'Add/Change Location' : 'Set Location'}</DialogTitle>
          <DialogDescription>
            {allowSave ? "To save a location, provide a name. Otherwise, the location will only be updated for this session." : "Use your current location or enter one manually."}
          </DialogDescription>
        </DialogHeader>

        {showManual ? (
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-4" onKeyDown={(e) => e.stopPropagation()}>
                {allowSave && (
                     <Input
                        placeholder="Save as (e.g., Office, Home)... (optional)"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                    />
                )}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Enter any city, town, or address (type for suggestions...)"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          handleKeyDown(e);
                        }}
                        autoComplete="street-address"
                        required
                        className="pl-10"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>
                {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-popover border border-border rounded-md shadow-lg">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={suggestion.place_id}
                                type="button"
                                onClick={() => handleSuggestionClick(suggestion)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                                    index === selectedIndex ? 'bg-accent' : ''
                                }`}
                            >
                                {suggestion.display_name}
                            </button>
                        ))}
                    </div>
                )}
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setShowManual(false)}>Back</Button>
                    <Button type="submit" disabled={isFetching}>
                        <Save className="mr-2 h-4 w-4"/>
                        {isFetching ? 'Finding Location...' : locationName.trim() ? 'Save and Set' : 'Set Location'}
                    </Button>
                </DialogFooter>
            </form>
        ) : (
            <div className="space-y-4 py-4">
                 {allowSave && (
                     <Input
                        placeholder="Save as (e.g., Office, Home)... (optional)"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                    />
                )}
                <Button onClick={handleAutoDetect} className="w-full h-16" disabled={isFetching}>
                    {isFetching ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Fetching Location...
                        </>
                    ) : (
                        <>
                            <MapPin className="mr-2 h-5 w-5"/>
                            Use Current Location
                        </>
                    )}
                </Button>
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => setShowManual(true)} disabled={isFetching}>
                    Enter Location Manually
                </Button>
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

    