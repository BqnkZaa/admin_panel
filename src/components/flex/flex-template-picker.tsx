"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTemplates } from "@/actions/flex-template.actions";
import { Loader2 } from "lucide-react";

interface FlexTemplatePickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSelect: (template: any) => void;
}

export function FlexTemplatePicker({ open, onOpenChange, onSelect }: FlexTemplatePickerProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getTemplates()
                .then((data) => setTemplates(data))
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Select Flex Message Template</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8">
                            No templates found. Go to Flex Builder to create one.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    className="border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors"
                                    onClick={() => {
                                        onSelect(template);
                                        onOpenChange(false);
                                    }}
                                >
                                    <div className="font-semibold">{template.name}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                                    </div>
                                    <div className="mt-2 text-xs truncate opacity-70">
                                        {JSON.stringify(template.content)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
