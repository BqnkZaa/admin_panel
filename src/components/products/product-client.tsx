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
            toast({ title: "Product deleted" });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setDeleteId(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
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
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
