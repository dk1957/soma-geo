import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getEmailFromUser, isAdminEmail } from "@/lib/auth/admin"
import { AgentConfigView } from "../agent-config-v2/agent-config-view"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Agent Configuration | Soma AI Admin",
  description: "Configure AI agent systems and their sub-agents",
}

export default async function AgentConfigPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin?redirect_url=/admin/agent-config')
  }

  const userEmail = getEmailFromUser(user)
  if (!isAdminEmail(userEmail)) {
    redirect('/dashboard')
  }

  return <AgentConfigView userEmail={userEmail} />
}
