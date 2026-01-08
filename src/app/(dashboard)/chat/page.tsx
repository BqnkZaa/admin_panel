import { MessageSquare } from "lucide-react";

export default function ChatPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <h2 className="text-xl font-medium">เลือกการสนทนา</h2>
            <p className="text-sm">เลือกลูกค้าจากรายการเพื่อเริ่มแชท</p>
        </div>
    );
}
