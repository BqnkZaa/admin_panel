import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, MessageCircle, Server } from "lucide-react";
import { checkSystemHealth } from "@/actions/settings.actions";
import { auth } from "@/auth";
import { LineConnectionTest } from "@/components/settings/line-connection-test";

export default async function SettingsPage() {
    const session = await auth();
    const health = await checkSystemHealth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">ตั้งค่า</h1>
                <p className="text-muted-foreground">สถานะระบบและการตั้งค่าทั่วไป</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* System Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="w-5 h-5" /> สถานะระบบ
                        </CardTitle>
                        <CardDescription>สถานะการทำงานของบริการต่างๆ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">ฐานข้อมูล (PostgreSQL)</p>
                                    <p className="text-xs text-muted-foreground">พื้นที่จัดเก็บข้อมูลหลัก</p>
                                </div>
                            </div>
                            {health.database ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">เชื่อมต่อแล้ว</Badge>
                            ) : (
                                <Badge variant="destructive">ไม่ได้เชื่อมต่อ</Badge>
                            )}
                        </div>
                        {/* 
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Redis (Queue)</p>
                                    <p className="text-xs text-muted-foreground">Background job processing</p>
                                </div>
                            </div>
                           <Badge variant="outline">Unknown (Check logs)</Badge>
                        </div> 
                        */}
                    </CardContent>
                </Card>

                {/* LINE API Connection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" /> การเชื่อมต่อ LINE API
                        </CardTitle>
                        <CardDescription>ตรวจสอบการตั้งค่า Messaging API</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LineConnectionTest />
                    </CardContent>
                </Card>

                {/* Admin Profile */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>ข้อมูลผู้ดูแลระบบ</CardTitle>
                        <CardDescription>ข้อมูลการเข้าสู่ระบบของคุณ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>อีเมล</Label>
                            <Input disabled value={session?.user?.email || "Unknown"} />
                        </div>
                        <div className="grid gap-2">
                            <Label>บทบาท</Label>
                            <Input disabled value={session?.user?.role || "ADMIN"} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
