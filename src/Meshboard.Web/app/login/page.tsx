import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
// import { serverAuthApi } from "@/lib/auth/server-auth-api"

export default async function LoginPage() {
    // const user = await serverAuthApi()
    //
    // if (user) {
    //     redirect("/mail?box=INBOX")
    // }

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight">Welcome to Meshboard</h1>
                </div>

                <LoginForm />
            </div>
        </main>
    )
}
