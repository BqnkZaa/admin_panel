import { getBroadcasts } from "@/actions/broadcast.actions";
import BroadcastForm from "@/components/broadcast/broadcast-form";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default async function BroadcastPage() {
    const broadcasts = await getBroadcasts();

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Broadcast</h2>
                    <p className="text-slate-500">สร้างและจัดการแคมเปญข้อความ</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-12 lg:col-span-4">
                    <BroadcastForm />
                </div>

                <Card className="col-span-12 lg:col-span-3 h-full border-0 shadow-sm rounded-xl overflow-hidden flex flex-col">
                    <CardHeader className="bg-purple-50 border-b border-purple-100 pb-4">
                        <CardTitle className="text-purple-900 flex items-center gap-2">
                            ประวัติการส่งล่าสุด
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-purple-50">
                                    <TableHead className="w-[100px] pl-4">วันที่</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                    <TableHead className="text-right pr-4">ส่งแล้ว</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {broadcasts.map((b) => (
                                    <TableRow key={b.id} className="hover:bg-purple-50/50 border-b border-purple-50 last:border-0">
                                        <TableCell className="font-medium text-xs text-slate-600 pl-4 py-3">
                                            {format(new Date(b.createdAt), "d MMM HH:mm", { locale: th })}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={b.status} />
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-slate-600 pr-4">
                                            {b.sentCount.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {broadcasts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground p-8">
                                            ไม่มีประวัติการส่ง
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        QUEUED: "bg-yellow-100 text-yellow-700 border-yellow-200",
        PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
        COMPLETED: "bg-green-100 text-green-700 border-green-200",
        FAILED: "bg-red-100 text-red-700 border-red-200",
        DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    };

    const labels: Record<string, string> = {
        QUEUED: "รอส่ง",
        PROCESSING: "กำลังส่ง",
        COMPLETED: "สำเร็จ",
        FAILED: "ล้มเหลว",
        DRAFT: "ร่าง",
    };

    return (
        <Badge variant="outline" className={`${styles[status] || "bg-gray-100"} border font-normal text-[10px] px-2`}>
            {labels[status] || status}
        </Badge>
    );
}
