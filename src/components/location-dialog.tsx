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
import { Loader2, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocationDialogProps {
  children: React.ReactNode;
  onLocationUpdate: (position: GeolocationPosition) => void;
  onManualLocationSubmit: (address: string) => void;
}

export function LocationDialog({ children, onLocationUpdate, onManualLocationSubmit }: LocationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

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
        onLocationUpdate(position);
        setIsFetching(false);
        setOpen(false);
        toast({
          title: 'Location Set!',
          description: 'Your location has been updated automatically.',
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsFetching(false);
        toast({
          variant: 'destructive',
          title: 'Location Access Denied',
          description: 'Please enable location permissions in your browser settings.',
        });
        setShowManual(true); // Offer manual input if auto fails
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
      onManualLocationSubmit(manualAddress);
      setOpen(false);
  }

  const resetState = () => {
    setShowManual(false);
    setIsFetching(false);
    setManualAddress('');
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
          <DialogTitle>Set Your Location</DialogTitle>
          <DialogDescription>
            Allow access to your location for real-time alerts or enter it manually.
          </DialogDescription>
        </DialogHeader>
        
        {showManual ? (
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                <Input 
                    placeholder="Enter your full address"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setShowManual(false)}>Back</Button>
                    <Button type="submit">Save Address</Button>
                </DialogFooter>
            </form>
        ) : (
            <div className="space-y-4 py-4">
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
                <Button variant="secondary" className="w-full" onClick={() => setShowManual(true)} disabled={isFetching}>
                    Enter Location Manually
                </Button>
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
