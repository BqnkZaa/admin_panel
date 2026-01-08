"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, Plus } from "lucide-react";
import { getProducts } from "@/actions/product.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
}

interface ProductPickerDialogProps {
    onProductSelect: (flexJson: string) => void;
}

export function ProductPickerDialog({ onProductSelect }: ProductPickerDialogProps) {
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [products, setProducts] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [, startTransition] = useTransition();

    useEffect(() => {
        if (open) {
            startTransition(async () => {
                const result = await getProducts();
                // getProducts returns the array directly
                if (Array.isArray(result)) {
                    setProducts(result);
                }
            });
        }
    }, [open]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    const generateFlexJson = (product: Product) => {
        const bubble = {
            type: "bubble",
            hero: {
                type: "image",
                url: product.imageUrl || "https://placehold.co/800x520/png?text=No+Image", // Fallback
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover",
                action: {
                    type: "uri",
                    uri: product.imageUrl || "#"
                }
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: product.name,
                        weight: "bold",
                        size: "xl"
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "md",
                        contents: [
                            {
                                type: "text",
                                text: `${Number(product.price).toFixed(2)} THB`,
                                weight: "bold",
                                size: "xl",
                                color: "#1DB446"
                            }
                        ]
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "ดูรายละเอียด",
                            uri: `https://example.com/products/${product.id}` // Should be real public URL
                        },
                        color: "#0F172A"
                    }
                ],
                flex: 0
            }
        };

        // If simple flex, wrap in flex container wrapper if needed, 
        // but for 'flex message' update, usually we send { type: "flex", altText: "...", contents: bubble }
        // The form likely expects just the content definition or full message?
        // Let's provide the content Bubble object. The user can wrap it or usually the API wrapper does.
        // Wait, LINE API expects { type: "flex", altText: "...", contents: Container }.
        // I will return the Container JSON string (Bubble).
        return JSON.stringify(bubble, null, 2);
    };

    const handleSelect = (product: Product) => {
        const json = generateFlexJson(product);
        onProductSelect(json);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Package className="mr-2 h-4 w-4" />
                    Insert Product Card
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Product</DialogTitle>
                    <DialogDescription>
                        Choose a product to generate a Flex Message card.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => handleSelect(product)}
                        >
                            <Avatar className="h-12 w-12 rounded-lg mr-4">
                                <AvatarImage src={product.imageUrl} />
                                <AvatarFallback className="rounded-lg"><Package className="h-6 w-6" /></AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm">{product.name}</h4>
                                <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-sm">{Number(product.price).toFixed(2)}</span>
                                <Button size="icon" variant="ghost" className="h-8 w-8 ml-2">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No products found.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
