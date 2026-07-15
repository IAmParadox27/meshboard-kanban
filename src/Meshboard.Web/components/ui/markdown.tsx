import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
    content: string;
};

export function Markdown(
    {
        content,
    }: MarkdownProps,
) {
    return (
        <div
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:bg-muted/40 prose-blockquote:text-muted-foreground prose-a:text-primary">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    a: ({href, children, ...props}) => {
                        if (!href) {
                            return <span {...props}>{children}</span>;
                        }

                        const isExternal = href.startsWith("http://") || href.startsWith("https://");

                        if (isExternal) {
                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    {...props}
                                >
                                    {children}
                                </a>
                            );
                        }

                        return (
                            <Link href={href} {...props}>
                                {children}
                            </Link>
                        );
                    },
                    code: ({className, children, ...props}) => {
                        const isInline = !className;

                        if (isInline) {
                            return (
                                <code
                                    className="rounded bg-muted px-1.5 py-0.5 text-[0.875em]"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}