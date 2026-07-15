import { SourceSummaryModel } from "@/lib/models/source";

export class ApiClient
{
    public async GetSources(): Promise<SourceSummaryModel[]>
    {
        return await this.Get<SourceSummaryModel[]>("/api/sources");
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

    private async GetErrorMessage(response: Response, fallbackMessage: string): Promise<string>
    {
        try
        {
            const contentType = response.headers.get("content-type");

            if (contentType?.includes("application/json"))
            {
                const body = await response.json() as { message?: string };

                if (body.message)
                {
                    return body.message;
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