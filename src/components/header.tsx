
'use client';
import { Droplets, LogIn, LogOut, Menu, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useFirebase } from '@/firebase/client-provider';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/use-user-profile';

export function Header() {
  const { user, signOut } = useFirebase();
  const { profile } = useUserProfile();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  }

  const isVolunteer = profile?.role === 'volunteer';

  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Droplets className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold font-headline text-foreground">FloodGuard</h1>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
              {user && <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">Profile</Link>}
              {isVolunteer && <Link href="/volunteer" className="text-sm font-semibold text-primary hover:text-primary/80">Volunteer Panel</Link>}
          </nav>
           <div className="hidden md:block">
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
           </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Droplets className="h-6 w-6 text-primary" />
                <span className="sr-only">FloodGuard</span>
              </Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              { user && <Link href="/profile" className="text-muted-foreground hover:text-foreground">
                Profile
              </Link>}
               {isVolunteer && (
                    <Link href="/volunteer" className="flex items-center gap-2 font-semibold text-primary">
                        <ShieldCheck />
                        Volunteer Panel
                    </Link>
                )}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
                {user ? (
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
                ) : (
                <Button className="w-full" asChild>
                    <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                    </Link>
                </Button>
                )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
