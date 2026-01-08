"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct } from "@/actions/product.actions";
import { useEffect, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const productSchema = z.object({
    sku: z.string().min(1, "กรุณาระบุ SKU"),
    name: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "ราคาต้องมากกว่า 0"),
    stock: z.coerce.number().int().min(0, "จำนวนสินค้าต้องมากกว่า 0"),
    imageUrl: z.string().url("ลิงก์ไม่ถูกต้อง").optional().or(z.literal("")),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product?: any | null; // Product to edit, if any
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
    const [isPending, startTransition] = useTransition();
    const form = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            sku: "",
            name: "",
            description: "",
            price: 0,
            stock: 0,
            imageUrl: "",
        },
    });

    useEffect(() => {
        if (product) {
            form.reset({
                sku: product.sku,
                name: product.name,
                description: product.description || "",
                price: Number(product.price),
                stock: product.stock,
                imageUrl: product.imageUrl || "",
            });
        } else {
            form.reset({
                sku: "",
                name: "",
                description: "",
                price: 0,
                stock: 0,
                imageUrl: "",
            });
        }
    }, [product, form]);

    const onSubmit = (data: ProductFormValues) => {
        startTransition(async () => {
            let result;
            if (product) {
                result = await updateProduct(product.id, data);
            } else {
                result = await createProduct(data);
            }

            if (result.success) {
                toast({
                    title: "สำเร็จ",
                    description: `บันทึกข้อมูลสินค้าเรียบร้อย`,
                });
                onOpenChange(false);
                form.reset();
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</DialogTitle>
                    <DialogDescription>
                        {product
                            ? "แก้ไขข้อมูลสินค้าที่นี่"
                            : "เพิ่มสินค้าใหม่ในรายการของคุณ"}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SKU</FormLabel>
                                    <FormControl>
                                        <Input placeholder="PROD-001" {...field} value={field.value as string} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ชื่อสินค้า</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Product Name" {...field} value={field.value as string} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} value={field.value as number} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>จำนวนในสต็อก</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value as number} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ลิงก์รูปภาพ</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com/image.jpg" {...field} value={field.value as string} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รายละเอียด</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Product description..." {...field} value={field.value as string} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                บันทึกการเปลี่ยนแปลง
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
