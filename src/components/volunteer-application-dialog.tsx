'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase } from '@/firebase/client-provider';
import { addDoc, collection } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useRouter } from 'next/navigation';

const applicationSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  expertise: z.string().min(10, { message: 'Please describe your expertise briefly.' }),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export function VolunteerApplicationDialog({ children }: { children: React.ReactNode }) {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      expertise: '',
    },
  });

  const handleOpen = () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Login Required',
            description: 'You must be signed in to apply as a volunteer.',
        });
        router.push('/login');
    } else {
        setOpen(true);
    }
  }

  async function onSubmit(values: ApplicationFormValues) {
    if (!firestore || !user) return;

    setIsSubmitting(true);

    const appData = {
        userId: user.uid,
        name: values.name,
        expertise: values.expertise,
        status: 'pending',
    };

    try {
      await addDoc(collection(firestore, 'volunteerApplications'), appData);
      toast({
        title: 'Application Submitted!',
        description: 'Thank you for your interest. We will review your application shortly.',
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      const permissionError = new FirestorePermissionError({
          path: 'volunteerApplications',
          operation: 'create',
          requestResourceData: appData
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your application. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply to be a Volunteer</DialogTitle>
          <DialogDescription>
            Join our team of dedicated volunteers and help make a difference in your community.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ali Khan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills & Expertise</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., First aid certified, former rescue worker, strong swimmer..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
