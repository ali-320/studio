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
  onLocationUpdate: (position: GeolocationPosition, name?: string) => void;
  onManualLocationSubmit: (address: string, name?: string) => void;
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
      (position) => {
        const nameToSave = allowSave && locationName.trim() ? locationName.trim() : undefined;
        onLocationUpdate(position, nameToSave);
        
        if (nameToSave) {
          toast({ title: 'Location Saved!', description: `Saved "${nameToSave}" successfully.` });
        } else {
          toast({ title: 'Location Set!', description: 'Your location has been updated automatically.' });
        }
        
        setIsFetching(false);
        setOpen(false);
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
  
  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(manualAddress.trim() === '') {
          toast({ variant: 'destructive', title: 'Invalid Address', description: 'Please enter a valid address.' });
          return;
      }
      
      const nameToSave = allowSave && locationName.trim() ? locationName.trim() : undefined;
      onManualLocationSubmit(manualAddress, nameToSave);

      if (nameToSave) {
        toast({ title: 'Location Saved!', description: `Saved "${nameToSave}" successfully.` });
      } else {
        toast({ title: 'Location Set!', description: 'Your location has been updated.' });
      }

      setOpen(false);
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
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                {allowSave && (
                     <Input 
                        placeholder="Save as (e.g., Office, Home)... (optional)"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                    />
                )}
                <Input 
                    placeholder="Enter full address"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    required
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setShowManual(false)}>Back</Button>
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4"/>
                        {locationName.trim() ? 'Save and Set' : 'Set Location'}
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
