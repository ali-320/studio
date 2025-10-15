'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Camera,
  MapPin,
  ShieldAlert,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { triageIncident } from '@/ai/flows/triage-incident';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase/client-provider';

const incidentSchema = z.object({
  location: z.string().min(1, 'Location is required.'),
  severity: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select a severity level.',
  }),
  description: z.string().optional(),
  photo: z.any().optional(),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

export function ReportIncidentCard() {
  const { toast } = useToast();
  const { firestore, storage, user } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      location: '',
      severity: 'low',
      description: '',
    },
  });

  const handleGetLocation = () => {
    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        form.setValue('location', locationString);
        setIsLocationLoading(false);
        toast({
          title: 'Location Acquired',
          description: 'Your current location has been set.',
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocationLoading(false);
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: 'Could not get your location. Please enter it manually.',
        });
      }
    );
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      form.setValue('photo', file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: IncidentFormValues) {
    setIsLoading(true);
    setIsSuccess(false);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available.' });
      setIsLoading(false);
      return;
    }
    
    // Simulate offline capability
    const isOffline = !navigator.onLine;

    if (isOffline) {
        toast({
            title: 'You are offline',
            description: 'Your report will be submitted when you are back online.',
            variant: 'default',
        });
        // In a real PWA, you'd save this to IndexedDB to be processed by a service worker.
        setIsLoading(false);
        return;
    }

    try {
      const [lat, lng] = values.location.split(',').map(Number);
      let photoUrl = '';

      if (values.photo && storage) {
        const photoRef = ref(storage, `incidents/${Date.now()}_${values.photo.name}`);
        const uploadResult = await uploadBytes(photoRef, values.photo);
        photoUrl = await getDownloadURL(uploadResult.ref);
      }

      const incidentData = {
        userId: user?.uid || "anonymous",
        coordinates: { lat, lng },
        severity: "pending", // Set by triage function
        description: values.description || "",
        photoUrl: photoUrl,
        timestamp: serverTimestamp(),
        status: "reported", // Set by triage function
      };
      
      const incidentsCollection = collection(firestore, 'incidents');
      const docRef = await addDoc(incidentsCollection, incidentData);

      // Trigger the triage flow
      await triageIncident({
        incidentId: docRef.id,
        incidentData: {
          ...incidentData,
          coordinates: { lat: incidentData.coordinates.lat, lng: incidentData.coordinates.lng }
        }
      });
      
      setIsSuccess(true);
      toast({
          title: 'Report Submitted!',
          description: 'Thank you for helping your community. It is being analyzed.',
      });

      form.reset();
      setPhotoPreview(null);
      if(photoInputRef.current) {
        photoInputRef.current.value = "";
      }

    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
        <Card>
            <CardContent className="p-6 text-center">
                 <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <AlertTitle className="mt-4 text-xl font-bold">Report Submitted Successfully!</AlertTitle>
                <AlertDescription className="mt-2 text-muted-foreground">
                    Your report has been sent and is being reviewed. Thank you for your contribution.
                </AlertDescription>
                <Button onClick={() => setIsSuccess(false)} className="mt-6 w-full">
                    Submit Another Report
                </Button>
            </CardContent>
        </Card>
    )
  }


  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g., 31.5204, 74.3587" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetLocation}
                      disabled={isLocationLoading}
                    >
                      {isLocationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Initial Observation
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an initial observation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low - Minor water logging</SelectItem>
                      <SelectItem value="medium">Medium - Street flooding</SelectItem>
                      <SelectItem value="high">High - Dangerous, evacuation likely</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Water is knee-deep and rising slowly.'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Photo (Optional)
                  </FormLabel>
                  <FormControl>
                     <div className="relative">
                        <Input 
                            type="file" 
                            accept="image/*" 
                            className="w-full opacity-0 z-10 h-full absolute cursor-pointer"
                            onChange={handlePhotoChange}
                            ref={photoInputRef}
                        />
                        <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover rounded-md" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Camera className="mx-auto h-8 w-8" />
                                    <p>Click or tap to upload a photo</p>
                                </div>
                            )}
                        </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit Report
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
