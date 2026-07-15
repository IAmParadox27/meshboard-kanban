import { KanbanBoardModel } from "@/components/kanban/kanban-types";

export const kanbanBoardData: KanbanBoardModel = {
    title: "Jellyfin Workboard",
    description: "Unified view across GitHub issues, Fider requests, and internal work.",
    columns: [
        {
            id: "inbox",
            title: "Inbox",
            cards: [
                {
                    id: "GH-142",
                    title: "Fix plugin config validation for missing auth scopes",
                    description: "GitHub issue mirrored into Meshboard for triage and ownership.",
                    source: "github",
                    sourceLabel: "GitHub",
                    status: "pending",
                    proxyMode: "two-way",
                    assignee: {
                        name: "Zach",
                        initials: "Z",
                    },
                    tags: ["plugin", "auth"],
                    externalUrl: "https://github.com/example/repo/issues/142",
                    updatedAt: "2 hours ago",
                    commentsCount: 4,
                    createdAt: "3 days ago",
                    priority: "high",
                    reporter: {
                        name: "Alex",
                        initials: "A",
                    },
                    comments: [
                        {
                            id: "comment-1",
                            author: {
                                name: "Alex",
                                initials: "A",
                            },
                            body: "This started showing up after the provider settings refactor. Repro is consistent when scopes are missing.",
                            createdAt: "1 day ago",
                        },
                        {
                            id: "comment-2",
                            author: {
                                name: "Zach",
                                initials: "Z",
                            },
                            body: "Validation should probably fail earlier and show which source config is invalid.",
                            createdAt: "18 hours ago",
                        },
                    ],
                    activity: [
                        {
                            id: "activity-1",
                            description: "Imported from GitHub issue #142",
                            createdAt: "3 days ago",
                        },
                        {
                            id: "activity-2",
                            description: "Moved to Inbox",
                            createdAt: "2 days ago",
                        },
                        {
                            id: "activity-3",
                            description: "Assigned to Zach",
                            createdAt: "18 hours ago",
                        },
                    ],
                },
                {
                    id: "FD-55",
                    title: "Add dark mode preference to settings",
                    description: "Imported feature request from Fider. Still needs product decision.",
                    source: "fider",
                    sourceLabel: "Fider",
                    status: "synced",
                    proxyMode: "import-only",
                    assignee: {
                        name: "Alex",
                        initials: "A",
                    },
                    tags: ["ui", "settings"],
                    externalUrl: "https://fider.example.com/posts/55",
                    updatedAt: "5 hours ago",
                    commentsCount: 7,
                    createdAt: "3 days ago",
                    priority: "high",
                    reporter: {
                        name: "Alex",
                        initials: "A",
                    },
                    comments: [
                        {
                            id: "comment-1",
                            author: {
                                name: "Alex",
                                initials: "A",
                            },
                            body: "This started showing up after the provider settings refactor. Repro is consistent when scopes are missing.",
                            createdAt: "1 day ago",
                        },
                        {
                            id: "comment-2",
                            author: {
                                name: "Zach",
                                initials: "Z",
                            },
                            body: "Validation should probably fail earlier and show which source config is invalid.",
                            createdAt: "18 hours ago",
                        },
                    ],
                    activity: [
                        {
                            id: "activity-1",
                            description: "Imported from GitHub issue #142",
                            createdAt: "3 days ago",
                        },
                        {
                            id: "activity-2",
                            description: "Moved to Inbox",
                            createdAt: "2 days ago",
                        },
                        {
                            id: "activity-3",
                            description: "Assigned to Zach",
                            createdAt: "18 hours ago",
                        },
                    ]
                },
            ],
        },
        {
            id: "triaged",
            title: "Triaged",
            cards: [
                {id: "INT-12",
                    title: "Design source health panel",
                    description: "Internal card for a dashboard showing sync state and provider health.",
                    source: "internal",
                    sourceLabel: "Internal",
                    status: "synced",
                    proxyMode: "export-only",
                    assignee: {
                        name: "Zach",
                        initials: "Z",
                    },
                    tags: ["design", "dashboard"],
                    updatedAt: "1 day ago",
                    commentsCount: 2,
                    createdAt: "3 days ago",
                    priority: "high",
                    reporter: {
                        name: "Alex",
                        initials: "A",
                    },
                    comments: [
                        {
                            id: "comment-1",
                            author: {
                                name: "Alex",
                                initials: "A",
                            },
                            body: "This started showing up after the provider settings refactor. Repro is consistent when scopes are missing.",
                            createdAt: "1 day ago",
                        },
                        {
                            id: "comment-2",
                            author: {
                                name: "Zach",
                                initials: "Z",
                            },
                            body: "Validation should probably fail earlier and show which source config is invalid.",
                            createdAt: "18 hours ago",
                        },
                    ],
                    activity: [
                        {
                            id: "activity-1",
                            description: "Imported from GitHub issue #142",
                            createdAt: "3 days ago",
                        },
                        {
                            id: "activity-2",
                            description: "Moved to Inbox",
                            createdAt: "2 days ago",
                        },
                        {
                            id: "activity-3",
                            description: "Assigned to Zach",
                            createdAt: "18 hours ago",
                        },
                    ]
                },
            ],
        },
        {
            id: "in-progress",
            title: "In Progress",
            cards: [
                {
                    id: "GH-118",
                    title: "Implement local + OIDC login UX",
                    description: "Backend auth flow is working; frontend still needs proper login screen and status handling.",
                    source: "github",
                    sourceLabel: "GitHub",
                    status: "pending",
                    proxyMode: "two-way",
                    assignee: {
                        name: "Sam",
                        initials: "S",
                    },
                    tags: ["auth", "frontend"],
                    externalUrl: "https://github.com/example/repo/issues/118",
                    updatedAt: "30 minutes ago",
                    commentsCount: 3,
                    createdAt: "3 days ago",
                    priority: "high",
                    reporter: {
                        name: "Alex",
                        initials: "A",
                    },
                    comments: [
                        {
                            id: "comment-1",
                            author: {
                                name: "Alex",
                                initials: "A",
                            },
                            body: "This started showing up after the provider settings refactor. Repro is consistent when scopes are missing.",
                            createdAt: "1 day ago",
                        },
                        {
                            id: "comment-2",
                            author: {
                                name: "Zach",
                                initials: "Z",
                            },
                            body: "Validation should probably fail earlier and show which source config is invalid.",
                            createdAt: "18 hours ago",
                        },
                    ],
                    activity: [
                        {
                            id: "activity-1",
                            description: "Imported from GitHub issue #142",
                            createdAt: "3 days ago",
                        },
                        {
                            id: "activity-2",
                            description: "Moved to Inbox",
                            createdAt: "2 days ago",
                        },
                        {
                            id: "activity-3",
                            description: "Assigned to Zach",
                            createdAt: "18 hours ago",
                        },
                    ]
                },
                {
                    id: "FD-41",
                    title: "Show proxy direction clearly on board cards",
                    description: "Users should be able to see import-only, export-only, and two-way status at a glance.",
                    source: "fider",
                    sourceLabel: "Fider",
                    status: "conflict",
                    proxyMode: "two-way",
                    tags: ["ux", "sync"],externalUrl: "https://fider.example.com/posts/41",
                    updatedAt: "3 hours ago",
                    commentsCount: 5,
                    createdAt: "3 days ago",
                    priority: "high",
                    reporter: {
                        name: "Alex",
                        initials: "A",
                    },
                    comments: [
                        {
                            id: "comment-1",
                            author: {
                                name: "Alex",
                                initials: "A",
                            },
                            body: "This started showing up after the provider settings refactor. Repro is consistent when scopes are missing.",
                            createdAt: "1 day ago",
                        },
                        {
                            id: "comment-2",
                            author: {
                                name: "Zach",
                                initials: "Z",
                            },
                            body: "Validation should probably fail earlier and show which source config is invalid.",
                            createdAt: "18 hours ago",
                        },
                    ],
                    activity: [
                        {
                            id: "activity-1",
                            description: "Imported from GitHub issue #142",
                            createdAt: "3 days ago",
                        },
                        {
                            id: "activity-2",
                            description: "Moved to Inbox",
                            createdAt: "2 days ago",
                        },
                        {
                            id: "activity-3",
                            description: "Assigned to Zach",
                            createdAt: "18 hours ago",
                        },
                    ]
                },
            ],
        },
        {
            id: "done",
            title: "Done",
            cards: [
                {
                    id: "INT-03",
                    title: "Create initial auth provider abstractions",
                    description: "Local auth and OIDC plumbing are wired enough to move onto UI work.",
                    source: "internal",
                    sourceLabel: "Internal",
                    status: "synced",
                    proxyMode: "export-only",
                    assignee: {
                        name: "Zach",
                        initials: "Z",
                    },
                    tags: ["backend", "auth"],
                    updatedAt: "Yesterday",
                    commentsCount: 1,
                    createdAt: "3 days ago",
                    priority: "high",
                    reporter: {
                        name: "Alex",
                        initials: "A",
                    },
                    comments: [
                        {
                            id: "comment-1",
                            author: {
                                name: "Alex",
                                initials: "A",
                            },
                            body: "This started showing up after the provider settings refactor. Repro is consistent when scopes are missing.",
                            createdAt: "1 day ago",
                        },
                        {
                            id: "comment-2",
                            author: {
                                name: "Zach",
                                initials: "Z",
                            },
                            body: "Validation should probably fail earlier and show which source config is invalid.",
                            createdAt: "18 hours ago",
                        },
                    ],
                    activity: [
                        {
                            id: "activity-1",
                            description: "Imported from GitHub issue #142",
                            createdAt: "3 days ago",
                        },
                        {
                            id: "activity-2",
                            description: "Moved to Inbox",
                            createdAt: "2 days ago",
                        },
                        {
                            id: "activity-3",
                            description: "Assigned to Zach",
                            createdAt: "18 hours ago",
                        },
                    ]
                },
            ],
        },
    ],
};