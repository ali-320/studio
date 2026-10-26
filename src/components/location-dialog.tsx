
'use client';

import { useState } from 'react';
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
import { Loader2, MapPin, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
                <Input 
                    placeholder="Enter any city, town, or address"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoComplete="street-address"
                    required
                />
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

    