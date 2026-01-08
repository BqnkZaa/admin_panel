"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    imageUrl: string | null;
    isActive: boolean;
    description: string | null;
}

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">รูปภาพ</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead>ราคา</TableHead>
                        <TableHead>สต็อก</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <Avatar className="h-10 w-10 rounded-md">
                                    <AvatarImage src={product.imageUrl || ""} alt={product.name} />
                                    <AvatarFallback className="rounded-md">
                                        {product.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{product.sku}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>฿{product.price.toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant={product.stock > 0 ? "outline" : "destructive"}>
                                    {product.stock}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={product.isActive ? "default" : "secondary"}>
                                    {product.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2"
                                    onClick={() => onEdit(product)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(product.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {products.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                ไม่พบสินค้า คลิกปุ่ม &quot;เพิ่มสินค้า&quot; เพื่อเริ่มใช้งาน
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
