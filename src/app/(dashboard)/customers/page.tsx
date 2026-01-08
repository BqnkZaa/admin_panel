import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCustomers } from "@/actions/customer.actions";
import Link from "next/link";
import { CustomerActions } from "@/components/customers/customer-actions";

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const page = Number(searchParams.page) || 1;
    const { customers, totalPages, currentPage } = await getCustomers(page);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">ลูกค้า (CRM)</h1>
                    <p className="text-muted-foreground">จัดการผู้ติดตามและลูกค้าทั้งหมด</p>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">รูปโปรไฟล์</TableHead>
                            <TableHead>ชื่อที่แสดง</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead>แท็ก</TableHead>
                            <TableHead>ใช้งานล่าสุด</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers?.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarImage src={customer.pictureUrl || ""} />
                                        <AvatarFallback>{customer.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{customer.displayName}</span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {customer.lineUserId.substring(0, 8)}...
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {customer.isFollowing ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                ติดตามอยู่
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">เลิกติดตาม</Badge>
                                        )}
                                        {customer.isBlocked && (
                                            <Badge variant="destructive">บล็อก</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {customer.tags.length > 0 ? (
                                            customer.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0 h-5">
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {customer.lastActiveAt
                                        ? new Date(customer.lastActiveAt).toLocaleString("th-TH")
                                        : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <CustomerActions customer={customer} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination (Simple) */}
            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" disabled={(currentPage || 1) <= 1} asChild>
                    <Link href={`/customers?page=${(currentPage || 1) - 1}`}>ก่อนหน้า</Link>
                </Button>
                <span className="text-sm">
                    หน้า {currentPage || 1} จาก {totalPages || 1}
                </span>
                <Button variant="outline" size="sm" disabled={(currentPage || 1) >= (totalPages || 1)} asChild>
                    <Link href={`/customers?page=${(currentPage || 1) + 1}`}>ถัดไป</Link>
                </Button>
            </div>
        </div>
    );
}
