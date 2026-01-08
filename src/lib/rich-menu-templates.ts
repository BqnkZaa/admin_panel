export type RichMenuBound = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type RichMenuTemplate = {
    id: string;
    name: string;
    type: "large" | "compact"; // large = 2500x1686, compact = 2500x843
    areas: RichMenuBound[];
};

export const RICH_MENU_TEMPLATES: RichMenuTemplate[] = [
    {
        id: "grid_6_large",
        name: "Large: 6 Buttons (2x3)",
        type: "large",
        areas: [
            // Top Row
            { x: 0, y: 0, width: 833, height: 843 },
            { x: 833, y: 0, width: 834, height: 843 },
            { x: 1667, y: 0, width: 833, height: 843 },
            // Bottom Row
            { x: 0, y: 843, width: 833, height: 843 },
            { x: 833, y: 843, width: 834, height: 843 },
            { x: 1667, y: 843, width: 833, height: 843 },
        ],
    },
    {
        id: "grid_4_large",
        name: "Large: 4 Buttons (2x2)",
        type: "large",
        areas: [
            { x: 0, y: 0, width: 1250, height: 843 },
            { x: 1250, y: 0, width: 1250, height: 843 },
            { x: 0, y: 843, width: 1250, height: 843 },
            { x: 1250, y: 843, width: 1250, height: 843 },
        ],
    },
    {
        id: "grid_3_compact",
        name: "Compact: 3 Buttons (1x3)",
        type: "compact", // 2500x843
        areas: [
            { x: 0, y: 0, width: 833, height: 843 },
            { x: 833, y: 0, width: 834, height: 843 },
            { x: 1667, y: 0, width: 833, height: 843 },
        ],
    },
    {
        id: "grid_2_compact",
        name: "Compact: 2 Buttons (1x2)",
        type: "compact",
        areas: [
            { x: 0, y: 0, width: 1250, height: 843 },
            { x: 1250, y: 0, width: 1250, height: 843 },
        ],
    },
    {
        id: "large_1_top_2_bottom",
        name: "Large: Header + 2 Bottom",
        type: "large",
        areas: [
            { x: 0, y: 0, width: 2500, height: 843 },
            { x: 0, y: 843, width: 1250, height: 843 },
            { x: 1250, y: 843, width: 1250, height: 843 },
        ],
    },
    {
        id: "large_1_top_3_bottom",
        name: "Large: Header + 3 Bottom",
        type: "large",
        areas: [
            { x: 0, y: 0, width: 2500, height: 843 },
            { x: 0, y: 843, width: 833, height: 843 },
            { x: 833, y: 843, width: 834, height: 843 },
            { x: 1667, y: 843, width: 833, height: 843 },
        ],
    },
];
