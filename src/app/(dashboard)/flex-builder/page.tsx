import { FlexBuilderClient } from "@/components/flex-builder/flex-builder-client";
import { getTemplates } from "@/actions/flex-template.actions";

export default async function FlexBuilderPage() {
    const templates = await getTemplates();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Flex Message Builder</h1>
                <p className="text-muted-foreground">Manage and design your Flex Message templates.</p>
            </div>
            <FlexBuilderClient initialTemplates={templates} />
        </div>
    );
}
