import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";

import AuthPage from "@/pages/auth";
import CreateCharacterPage from "@/pages/create-character";
import GameShell from "@/components/GameShell";
import HomePage from "@/pages/home";
import CultivationPage from "@/pages/cultivation";
import InventoryPage from "@/pages/inventory";
import BossPage from "@/pages/boss";
import MissionPage from "@/pages/mission";
import ChatPage from "@/pages/chat";
import SectPage from "@/pages/sect";
import MarketPage from "@/pages/market";
import LeaderboardPage from "@/pages/leaderboard";
import TopupPage from "@/pages/topup";
import AdminPage from "@/pages/admin";
import OnlinePage from "@/pages/online";
import NpcPage from "@/pages/npc";
import SkillPage from "@/pages/skill";
import PetPage from "@/pages/pet";
import DungeonPage from "@/pages/dungeon";
import AchievementPage from "@/pages/achievement";
import AlchemyPage from "@/pages/alchemy";
import GuidePage from "@/pages/guide";
import BattlePassPage from "@/pages/battle-pass";
import EconomyLogPage from "@/pages/economy-log";
import MonthlyCardPage from "@/pages/monthly-card";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10000 } },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthGuard({ children }: { children: (user: any) => React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<"loading" | "authed" | "unauthed">("loading");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { setState("unauthed"); return; }
    fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(u => { setUser(u); setState("authed"); })
      .catch(() => { setState("unauthed"); });
  }, []);

  useEffect(() => {
    if (state === "unauthed") setLocation("/auth");
  }, [state]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0805] flex items-center justify-center">
        <div className="text-center">
          <div className="text-amber-500 text-xl mb-3">☯</div>
          <div className="text-amber-800 text-sm tracking-widest animate-pulse">HOA THIÊN KHAI ĐẠO...</div>
        </div>
      </div>
    );
  }
  if (state === "unauthed") return null;
  return <>{children(user)}</>;
}

function GameRouter({ user }: { user: any }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${BASE}/api/character`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      if (r.status === 404) setLocation("/create-character");
    }).catch(() => {});
  }, []);

  return (
    <GameShell user={user}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/cultivation" component={CultivationPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/boss" component={BossPage} />
        <Route path="/mission" component={MissionPage} />
        <Route path="/npc" component={NpcPage} />
        <Route path="/skill" component={SkillPage} />
        <Route path="/pet" component={PetPage} />
        <Route path="/dungeon" component={DungeonPage} />
        <Route path="/achievement" component={AchievementPage} />
        <Route path="/alchemy" component={AlchemyPage} />
        <Route path="/battle-pass" component={BattlePassPage} />
        <Route path="/monthly-card" component={MonthlyCardPage} />
        <Route path="/economy-log" component={EconomyLogPage} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/sect" component={SectPage} />
        <Route path="/market" component={MarketPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/topup" component={TopupPage} />
        <Route path="/online" component={OnlinePage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/guide" component={GuidePage} />
        <Route component={NotFound} />
      </Switch>
    </GameShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/create-character">
        <AuthGuard>{() => <CreateCharacterPage />}</AuthGuard>
      </Route>
      <Route>
        <AuthGuard>{(user) => <GameRouter user={user} />}</AuthGuard>
      </Route>
    </Switch>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={BASE}>
        <Router />
      </WouterRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#120e08", border: "1px solid #78350f44", color: "#fbbf24" },
        }}
      />
    </QueryClientProvider>
  );
}
