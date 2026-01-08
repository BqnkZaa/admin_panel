"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Code, LayoutTemplate } from "lucide-react";
import { saveTemplate, deleteTemplate } from "@/actions/flex-template.actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

import { Eye } from "lucide-react";

interface Template {
    id: string;
    name: string;
    content: unknown;
    createdAt: Date;
}

export function FlexBuilderClient({ initialTemplates }: { initialTemplates: Template[] }) {
    const [templates] = useState<Template[]>(initialTemplates);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Editor State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [jsonContent, setJsonContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Helper to open editor
    const openEditor = (template?: Template) => {
        if (template) {
            setEditingId(template.id);
            setName(template.name);
            setJsonContent(JSON.stringify(template.content, null, 2));
        } else {
            setEditingId(null);
            setName("");
            setJsonContent('{\n  "type": "bubble",\n  "body": {\n    "type": "box",\n    "layout": "vertical",\n    "contents": [\n      {\n        "type": "text",\n        "text": "Hello World"\n      }\n    ]\n  }\n}');
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        try {
            const parsed = JSON.parse(jsonContent);
            startTransition(async () => {
                const res = await saveTemplate({
                    id: editingId || undefined,
                    name,
                    content: parsed
                });

                if (res.success) {
                    toast({ title: "บันทึกเทมเพลตเรียบร้อย" });
                    setIsDialogOpen(false);
                    // Refresh data would normally happen via revalidatePath, but client state might need manual update if not full reload.
                    // Since server action revalidates path, router 'refresh' is needed or just rely on Next.js cache revalidation.
                    // For now, let's reload or trust revalidate.
                    window.location.reload();
                } else {
                    toast({ title: "เกิดข้อผิดพลาด", description: res.error, variant: "destructive" });
                }
            });
        } catch (e) {
            toast({ title: "JSON ไม่ถูกต้อง", description: (e as Error).message, variant: "destructive" });
        }
    };

    const handleDelete = (id: string) => {
        if (!confirm("คุณแน่ใจหรือไม่?")) return;
        startTransition(async () => {
            await deleteTemplate(id);
            window.location.reload();
        });
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Create New Card */}
                <Card className="flex flex-col items-center justify-center h-[200px] border-dashed cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors" onClick={() => openEditor()}>
                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="font-medium text-muted-foreground">สร้างเทมเพลตใหม่</p>
                </Card>

                {/* Templates List */}
                {templates.map((t) => (
                    <Card key={t.id} className="h-[200px] flex flex-col justify-between">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg truncate flex items-center gap-2">
                                <LayoutTemplate className="h-4 w-4" />
                                {t.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground line-clamp-3 overflow-hidden font-mono text-xs bg-slate-50 mx-6 p-2 rounded">
                            {JSON.stringify(t.content).substring(0, 100)}...
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditor(t)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(t.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Editor Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[800px] h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "แก้ไขเทมเพลต" : "สร้างเทมเพลต"}</DialogTitle>
                        <DialogDescription>ออกแบบ Flex Message ของคุณ</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 flex-1">
                        <div className="space-y-2">
                            <Label>ชื่อเทมเพลต</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น การ์ดโปรโมชั่น" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                            <div className="flex flex-col gap-2 h-full">
                                <Label className="flex items-center gap-1"><Code className="h-4 w-4" /> โค้ด JSON</Label>
                                <Textarea
                                    className="flex-1 font-mono text-xs resize-none"
                                    value={jsonContent}
                                    onChange={(e) => setJsonContent(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2 h-full">
                                <Label className="flex items-center gap-1"><Eye className="h-4 w-4" /> ตัวอย่าง (จำลอง)</Label>
                                <div className="flex-1 border rounded-md bg-slate-100 flex items-center justify-center text-muted-foreground text-center p-4">
                                    <div className="space-y-2">
                                        <p>การแสดงผลจริงอาจแตกต่างจากตัวอย่าง</p>
                                        <p className="text-xs">ควรทดสอบด้วยฟังก์ชัน &quot;ส่งข้อความ&quot; เพื่อดูผลลัพธ์จริง</p>
                                        <Badge variant="outline">ตัวอย่างเบื้องต้น</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={isPending}>บันทึกเทมเพลต</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
