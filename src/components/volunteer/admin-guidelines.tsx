
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { DraftingCompass } from "lucide-react";

export function AdminGuidelines() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DraftingCompass /> Guidelines</CardTitle>
                <CardDescription>Important information from admin</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    In the event of a high-risk alert, prioritize your safety first. Do not enter unstable structures or deep water. Your primary role is to assess, report, and coordinate with official first responders. Await confirmation before attempting any direct rescue.
                </p>
            </CardContent>
        </Card>
    );
}
