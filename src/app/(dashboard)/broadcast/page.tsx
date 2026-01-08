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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Broadcast</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <BroadcastForm />
                </div>

                <Card className="col-span-3 h-full">
                    <CardHeader>
                        <CardTitle>ประวัติการส่ง</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                    <TableHead className="text-right">ส่ง/ล้มเหลว</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {broadcasts.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium text-xs">
                                            {format(new Date(b.createdAt), "d MMM HH:mm", { locale: th })}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={b.status} />
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            {b.sentCount} / {b.failedCount}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {broadcasts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground p-4">
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
        QUEUED: "bg-yellow-500 hover:bg-yellow-600",
        PROCESSING: "bg-blue-500 hover:bg-blue-600",
        COMPLETED: "bg-green-500 hover:bg-green-600",
        FAILED: "bg-red-500 hover:bg-red-600",
        DRAFT: "bg-gray-500 hover:bg-gray-600",
    };

    return (
        <Badge className={`${styles[status] || "bg-gray-500"} text-[10px]`}>
            {status}
        </Badge>
    );
}
