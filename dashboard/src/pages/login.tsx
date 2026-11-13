import { useState } from "react"
import { AlertCircle, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, logout, saveLogin } from "@/lib/api"

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    saveLogin(username, password)
    try {
      await api("/login")
      onLogin()
    } catch {
      logout()
      setError("Invalid username or password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7F5] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-[#173D34] text-white shadow-md">
            <svg
              className="size-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L6 9h4l-4 7h6v5h2v-5h6l-4-7h4z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#17231F]">
            Harbor &amp; Pine
          </h1>
          <p className="mt-1 text-xs text-[#63716A]">
            Enterprise AI Customer Support Suite
          </p>
        </div>

        {/* Login Card */}
        <Card className="rounded-2xl border border-[#E3E9E4] bg-white shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold text-[#17231F]">
              Sign in to Operations Console
            </CardTitle>
            <CardDescription className="text-xs text-[#63716A]">
              Enter your admin credentials to access the support dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="username"
                  className="text-xs font-medium text-[#17231F]"
                >
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-[#929D96]" />
                  <Input
                    id="username"
                    type="text"
                    required
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-9 pl-9 text-xs border-[#E3E9E4] bg-[#F5F7F5]/50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#173D34]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium text-[#17231F]"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-[#929D96]" />
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 pl-9 text-xs border-[#E3E9E4] bg-[#F5F7F5]/50 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#173D34]"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mt-2 h-9 w-full rounded-lg bg-[#173D34] font-medium text-white shadow-xs hover:bg-[#245548] active:scale-[0.99] transition-all disabled:opacity-70"
              >
                {loading ? "Authenticating..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security / System Footer */}
        <p className="mt-6 text-center text-xs text-[#929D96]">
          Protected by constant-time HTTP Basic Auth &bull; All sessions logged
        </p>
      </div>
    </div>
  )
}
