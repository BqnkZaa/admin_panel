"use client";

import { useState } from "react";
import { ProductTable } from "./product-table";
import { ProductDialog } from "./product-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { deleteProduct } from "@/actions/product.actions";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductClientProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialProducts: any[];
}

export function ProductClient({ initialProducts }: ProductClientProps) {
    const [open, setOpen] = useState(false); // Dialog state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null); // For alert dialog
    const { toast } = useToast();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (product: any) => {
        setSelectedProduct(product);
        setOpen(true);
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        const result = await deleteProduct(deleteId);
        if (result.success) {
            toast({ title: "ลบสินค้าเรียบร้อย" });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setDeleteId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">สินค้า</h2>
                    <p className="text-slate-500">จัดการสินค้าและแคตตาล็อก</p>
                </div>
                <Button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-100 transition-all hover:-translate-y-0.5 rounded-lg h-10 px-4">
                    <Plus className="mr-2 h-4 w-4" /> เพิ่มสินค้าใหม่
                </Button>
            </div>

            <ProductTable
                products={initialProducts}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
            />

            <ProductDialog
                open={open}
                onOpenChange={setOpen}
                product={selectedProduct}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                        <AlertDialogDescription>
                            การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลสินค้าจะถูกลบถาวร
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            ลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
