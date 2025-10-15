'use client';

import { useState } from 'react';
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
  AlertTriangle,
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [location, setLocation] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
        setLocation(locationString);
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
    
    // Simulate offline capability
    const isOffline = !navigator.onLine;

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);

    if (isOffline) {
        toast({
            title: 'You are offline',
            description: 'Your report has been saved and will be submitted when you are back online.',
            variant: 'default',
        });
        // Here you would typically save the report to IndexedDB
    } else {
        setIsSuccess(true);
        toast({
            title: 'Report Submitted!',
            description: 'Thank you for helping your community.',
        });
    }

    form.reset();
    setPhotoPreview(null);
  }

  if (isSuccess) {
    return (
        <Card>
            <CardContent className="p-6 text-center">
                 <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <AlertTitle className="mt-4 text-xl font-bold">Report Submitted Successfully!</AlertTitle>
                <AlertDescription className="mt-2 text-muted-foreground">
                    Your report has been sent to the authorities. Thank you for your contribution.
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
                    <ShieldAlert className="h-4 w-4" /> Severity
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a severity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low - Minor water logging</SelectItem>
                      <SelectItem value="medium">Medium - Street flooding</SelectItem>
                      <SelectItem value="high">High - Dangerous, evacuation needed</SelectItem>
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
