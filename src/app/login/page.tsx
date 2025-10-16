'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/client-provider';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number with country code.'),
});

const codeSchema = z.object({
    code: z.string().length(6, 'Verification code must be 6 digits.'),
});

export default function LoginPage() {
  const { auth, firestore, user, loading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Memoize recaptcha verifier
  const getRecaptchaVerifier = useCallback(() => {
    if (auth && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
    return window.recaptchaVerifier;
  }, [auth]);

  useEffect(() => {
    // Initialize RecaptchaVerifier
    if (auth) {
      getRecaptchaVerifier();
    }
  }, [auth, getRecaptchaVerifier]);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);


  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      const verifier = getRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, values.phone, verifier);
      setConfirmationResult(result);
      toast({ title: 'Verification Code Sent', description: 'Please check your phone for the code.' });
    } catch (error: any) {
      console.error('SMS sending error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send Code',
        description: error.message || 'Please check the phone number and try again.',
      });
       // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId: any) => {
            if(window.grecaptcha){
                window.grecaptcha.reset(widgetId);
            }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onCodeSubmit(values: z.infer<typeof codeSchema>) {
    if (!confirmationResult || !firestore) return;
    setIsSubmitting(true);
    try {
      const userCredential = await confirmationResult.confirm(values.code);
      const user = userCredential.user;
      
      // Create user document in Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        phone: user.phoneNumber,
        role: 'registered',
        createdAt: new Date().toISOString(),
      }, { merge: true });

      toast({ title: 'Success!', description: 'You have been logged in.' });
      router.push('/'); // Redirect to home to set location
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'Invalid verification code. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || user) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground"> { user ? 'Redirecting to dashboard...' : 'Loading...' } </p>
        </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login or Sign Up</CardTitle>
          <CardDescription>
            {confirmationResult
              ? 'Enter the 6-digit code sent to your phone.'
              : 'Enter your phone number to receive a verification code.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmationResult ? (
             <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
                    <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input placeholder="+1 123 456 7890" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Code'}
                    </Button>
                </form>
             </Form>
          ) : (
            <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-6">
                     <FormField control={codeForm.control} name="code" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Verification Code</FormLabel>
                            <FormControl>
                                <Input placeholder="123456" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                         {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify and Sign In'}
                    </Button>
                    <Button variant="link" size="sm" onClick={() => setConfirmationResult(null)}>
                        Use a different phone number
                    </Button>
                </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

// Extend window type for recaptcha
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        grecaptcha?: any;
    }
}
