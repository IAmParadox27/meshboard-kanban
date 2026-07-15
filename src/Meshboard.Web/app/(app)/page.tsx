import { KanbanBoard } from "@/components/kanban/kanban-board";
import { kanbanBoardData } from "@/lib/demo-data/kanban-board-data";

export default function Home()
{
    return <KanbanBoard {...kanbanBoardData} />;
}