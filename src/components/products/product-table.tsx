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
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow className="border-b border-slate-100">
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
                        <TableRow key={product.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                            <TableCell>
                                <Avatar className="h-10 w-10 rounded-lg border border-slate-100">
                                    <AvatarImage src={product.imageUrl || ""} alt={product.name} />
                                    <AvatarFallback className="rounded-lg bg-orange-50 text-orange-600 font-bold">
                                        {product.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium text-slate-700">{product.sku}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>฿{product.price.toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={product.stock > 0 ? "text-orange-600 border-orange-200 bg-orange-50" : "text-red-600 border-red-200 bg-red-50"}>
                                    {product.stock}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={product.isActive ? "default" : "secondary"} className={product.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                                    {product.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                                    onClick={() => onEdit(product)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => onDelete(product.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {products.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <p>ไม่พบสินค้าในระบบ</p>
                                    <p className="text-xs">คลิกปุ่ม &quot;เพิ่มสินค้าใหม่&quot; เพื่อเริ่มสร้างแคตตาล็อกของคุณ</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
