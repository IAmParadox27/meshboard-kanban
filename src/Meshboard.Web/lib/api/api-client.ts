import { ExternalIssueDetailsModel, ExternalIssueModel } from "@/lib/models/external-issue";
import {
    SourceDefinitionModel,
    SourcesPageModel,
    UpsertSourceDefinitionRequest,
} from "@/lib/models/sources-models";
import {
    BoardDefinitionModel,
    BoardDetailsModel,
    BoardsPageModel,
    BoardIssueAssignmentRequest,
    MoveBoardIssuesRequest,
    UpsertBoardDefinitionRequest,
} from "@/lib/models/boards-models";
import {
    CurrentUserModel,
    UpdateCurrentUserRequest,
    UpdateUserRequest,
    UpsertUserSourceMappingRequest,
    UserSourceMappingModel,
    UsersPageModel,
    UserListItemModel,
} from "@/lib/models/users-models";

export class ApiClient
{
    public async GetBoardsPage(): Promise<BoardsPageModel>
    {
        return await this.Get<BoardsPageModel>("/api/boards");
    }

    public async GetBoard(boardId: string): Promise<BoardDetailsModel>
    {
        return await this.Get<BoardDetailsModel>(`/api/boards/${boardId}`);
    }

    public async CreateBoard(request: UpsertBoardDefinitionRequest): Promise<BoardDefinitionModel>
    {
        return await this.Send<BoardDefinitionModel>("/api/boards", "POST", request);
    }

    public async UpdateBoard(id: string, request: UpsertBoardDefinitionRequest): Promise<BoardDefinitionModel>
    {
        return await this.Send<BoardDefinitionModel>(`/api/boards/${id}`, "PUT", request);
    }

    public async DeleteBoard(id: string): Promise<void>
    {
        await this.Send<void>(`/api/boards/${id}`, "DELETE");
    }

    public async AddIssueToBoard(
        boardId: string,
        request: BoardIssueAssignmentRequest,
    ): Promise<void>
    {
        await this.Send<void>(`/api/boards/${boardId}/issues`, "POST", request);
    }

    public async RemoveIssueFromBoard(
        boardId: string,
        request: BoardIssueAssignmentRequest,
    ): Promise<void>
    {
        await this.Send<void>(`/api/boards/${boardId}/issues`, "DELETE", request);
    }

    public async ClearBoard(boardId: string): Promise<void>
    {
        await this.Send<void>(`/api/boards/${boardId}/clear`, "DELETE");
    }

    public async MoveAllIssues(
        boardId: string,
        request: MoveBoardIssuesRequest,
    ): Promise<void>
    {
        await this.Send<void>(`/api/boards/${boardId}/issues/move`, "POST", request);
    }

    public async GetSourcesPage(): Promise<SourcesPageModel>
    {
        return await this.Get<SourcesPageModel>("/api/sources");
    }

    public async GetCurrentUser(): Promise<CurrentUserModel>
    {
        return await this.Get<CurrentUserModel>("/api/users/me");
    }

    public async UpdateCurrentUser(request: UpdateCurrentUserRequest): Promise<CurrentUserModel>
    {
        return await this.Send<CurrentUserModel>("/api/users/me", "PUT", request);
    }

    public async UpsertCurrentUserSourceMapping(
        sourceId: string,
        request: UpsertUserSourceMappingRequest,
    ): Promise<UserSourceMappingModel>
    {
        return await this.Send<UserSourceMappingModel>(`/api/users/me/source-mappings/${sourceId}`, "PUT", request);
    }

    public async DeleteCurrentUserSourceMapping(sourceId: string): Promise<void>
    {
        await this.Send<void>(`/api/users/me/source-mappings/${sourceId}`, "DELETE");
    }

    public async GetUsersPage(): Promise<UsersPageModel>
    {
        return await this.Get<UsersPageModel>("/api/users");
    }

    public async UpdateUser(
        id: string,
        request: UpdateUserRequest,
    ): Promise<UserListItemModel>
    {
        return await this.Send<UserListItemModel>(`/api/users/${id}`, "PUT", request);
    }

    public async SignOut(): Promise<void>
    {
        await this.Send<void>("/api/auth/logout", "POST");
    }

    public async CreateSource(request: UpsertSourceDefinitionRequest): Promise<SourceDefinitionModel>
    {
        return await this.Send<SourceDefinitionModel>("/api/sources", "POST", request);
    }

    public async UpdateSource(id: string, request: UpsertSourceDefinitionRequest): Promise<SourceDefinitionModel>
    {
        return await this.Send<SourceDefinitionModel>(`/api/sources/${id}`, "PUT", request);
    }

    public async DeleteSource(id: string): Promise<void>
    {
        await this.Send<void>(`/api/sources/${id}`, "DELETE");
    }

    public async GetIssues(): Promise<ExternalIssueModel[]>
    {
        return await this.Get<ExternalIssueModel[]>("/api/issues");
    }

    public async GetIssueDetails(
        sourceId: string,
        externalId: string,
    ): Promise<ExternalIssueDetailsModel>
    {
        const encodedExternalId = encodeURIComponent(externalId);
        return await this.Get<ExternalIssueDetailsModel>(`/api/issues/${sourceId}/${encodedExternalId}`);
    }

    private async Get<T>(path: string): Promise<T>
    {
        const response = await fetch(path, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok)
        {
            throw new Error(await this.GetErrorMessage(response, "Request failed."));
        }

        return await response.json() as T;
    }

    private async Send<T>(path: string, method: string, body?: unknown): Promise<T>
    {
        const response = await fetch(path, {
            method,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok)
        {
            throw new Error(await this.GetErrorMessage(response, "Request failed."));
        }

        if (response.status === 204)
        {
            return undefined as T;
        }

        return await response.json() as T;
    }

    private async GetErrorMessage(response: Response, fallbackMessage: string): Promise<string>
    {
        try
        {
            const contentType = response.headers.get("content-type");

            if (contentType?.includes("application/json"))
            {
                const body = await response.json() as { message?: string; detail?: string; title?: string };

                if (body.message)
                {
                    return body.message;
                }

                if (body.detail)
                {
                    return body.detail;
                }

                if (body.title)
                {
                    return body.title;
                }
            }

            const text = await response.text();

            if (text)
            {
                return text;
            }
        }
        catch
        {
        }

        return fallbackMessage;
    }
}

export const apiClient = new ApiClient();