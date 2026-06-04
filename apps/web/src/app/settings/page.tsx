import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserWorkspaces, getUserDetails } from "./actions";
import { SettingsTabs } from "./components/SettingsTabs";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaces = await getUserWorkspaces(session.user.id);
  const { user, subscription } = await getUserDetails(session.user.id);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-obsidian-night text-white font-mono">
      <div className="flex flex-col md:flex-row flex-1 border-t border-white/10 overflow-hidden">
        <SettingsTabs
          workspaces={workspaces}
          userId={session.user.id}
          isActive={user?.isActive ?? true}
          subscription={subscription}
        />
      </div>
    </div>
  );
}
