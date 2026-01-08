import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWelcomeMessage, getKeywords } from "@/actions/automation.actions";
import { WelcomeSettings } from "@/components/automation/welcome-settings";
import { KeywordSettings } from "@/components/automation/keyword-settings";

export default async function AutomationPage() {
    const welcomeMessage = await getWelcomeMessage();
    const keywords = await getKeywords();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Automation</h2>
            </div>

            <Tabs defaultValue="welcome" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="welcome">Welcome Message</TabsTrigger>
                    <TabsTrigger value="keywords">Keyword Replies</TabsTrigger>
                </TabsList>
                <TabsContent value="welcome" className="space-y-4">
                    <WelcomeSettings initialData={welcomeMessage} />
                </TabsContent>
                <TabsContent value="keywords" className="space-y-4">
                    <KeywordSettings keywords={keywords} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
