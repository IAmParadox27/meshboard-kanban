import { KanbanBoardView } from "@/components/kanban/kanban-board-view";

type BoardPageProps = {
    params: Promise<{
        boardId: string;
    }>;
};

export default async function BoardPage(
    {
        params,
    }: BoardPageProps,
) {
    const {boardId} = await params;
    return <KanbanBoardView boardId={boardId}/>;
}