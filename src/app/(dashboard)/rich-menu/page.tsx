import { getRichMenus, getDefaultRichMenuId } from "@/actions/rich-menu.actions";
import RichMenuPageClient from "./rich-menu-client";

export default async function RichMenuPage() {
    const richMenus = await getRichMenus();
    const defaultRichMenuId = await getDefaultRichMenuId();

    return <RichMenuPageClient richMenus={richMenus} defaultRichMenuId={defaultRichMenuId} />;
}
