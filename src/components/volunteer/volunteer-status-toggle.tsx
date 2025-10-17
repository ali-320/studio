
'use client';

import { useFirebase } from "@/firebase/client-provider";
import { doc, updateDoc } from "firebase/firestore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

type Status = 'available' | 'offline' | 'responding';

export function VolunteerStatusToggle({ currentStatus }: { currentStatus: Status }) {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();

    const handleStatusChange = async (newStatus: Status) => {
        if (!user || !firestore) return;

        const userRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userRef, { status: newStatus });
            toast({ title: "Status Updated", description: `You are now set to: ${newStatus}` });
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { status: newStatus }
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update your status." });
        }
    };

    const getStatusColor = (status: Status) => {
        switch (status) {
            case 'available': return 'bg-green-500';
            case 'offline': return 'bg-gray-500';
            case 'responding': return 'bg-yellow-500';
        }
    };

    return (
        <div className="flex flex-col space-y-2">
            <Label className="font-semibold">Your Status</Label>
            <RadioGroup
                defaultValue={currentStatus}
                onValueChange={(value: Status) => handleStatusChange(value)}
                className="flex items-center space-x-4"
            >
                {(['available', 'offline', 'responding'] as Status[]).map(status => (
                    <div key={status} className="flex items-center space-x-2">
                        <RadioGroupItem value={status} id={`status-${status}`} />
                        <Label htmlFor={`status-${status}`} className="flex items-center gap-2 capitalize">
                           <span className={cn("h-3 w-3 rounded-full", getStatusColor(status))}></span>
                           {status}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
}
