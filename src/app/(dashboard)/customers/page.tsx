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
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">ลูกค้า (CRM)</h1>
                    <p className="text-slate-500">จัดการข้อมูลลูกค้าและผู้ติดตามทั้งหมด</p>
                </div>
                {/* Could add Export/Import buttons here later */}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[80px]">โปรไฟล์</TableHead>
                            <TableHead>ชื่อลูกค้า</TableHead>
                            <TableHead>สถานะ</TableHead>
                            <TableHead>แท็ก (Tags)</TableHead>
                            <TableHead>ใช้งานล่าสุด</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers?.map((customer) => (
                            <TableRow key={customer.id} className="hover:bg-slate-50 transition-colors">
                                <TableCell>
                                    <Avatar className="h-10 w-10 border border-slate-100">
                                        <AvatarImage src={customer.pictureUrl || ""} />
                                        <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{customer.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-slate-900 font-semibold">{customer.displayName}</span>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {customer.lineUserId.substring(0, 8)}...
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {customer.isFollowing ? (
                                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                                                ติดตาม
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-slate-500">เลิกติดตาม</Badge>
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
                                                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 h-6 bg-slate-100 text-slate-600 hover:bg-slate-200">
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">-</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm">
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

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-500">
                    หน้า {currentPage || 1} จาก {totalPages || 1}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={(currentPage || 1) <= 1} asChild className="rounded-lg h-9">
                        <Link href={`/customers?page=${(currentPage || 1) - 1}`}>ก่อนหน้า</Link>
                    </Button>
                    <Button variant="outline" size="sm" disabled={(currentPage || 1) >= (totalPages || 1)} asChild className="rounded-lg h-9">
                        <Link href={`/customers?page=${(currentPage || 1) + 1}`}>ถัดไป</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
