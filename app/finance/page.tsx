"use client";

import React, { useState, useEffect } from "react";
import {
  apiLogin, apiRegister, apiLogout,
  apiSearchUsers,
  apiGetTransactions, apiAddTransaction, apiDeleteTransaction,
  apiGetGroups, apiCreateGroup, apiAddGroupMember, apiAddGroupExpense,
  apiUpdateUser, apiPurchaseShopItem,
  apiGetSavingsGoals, apiCreateSavingsGoal, apiContributeToSavingsGoal, apiDeleteSavingsGoal,
  apiUpdateBudgetLimits,
  apiGetSessionUser
} from "@/app/api/finance/actions";
import { AreaChart, Area, XAxis, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts";

// ── Types & Interfaces ──────────────────────────────────────────────────────
interface FinanceUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  theme: string;
  unlockedAvatars: string[];
  unlockedThemes: string[];
  budgetLimits: { [category: string]: number };
  points: number;
  xp: number;
  level: number;
  streak: number;
}

interface PairwiseDebt {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

function calculateDebts(members: GroupMember[], expenses: GroupExpense[]): PairwiseDebt[] {
  const nets: { [userId: string]: number } = {};
  members.forEach(m => nets[m.id] = 0);

  expenses.forEach(e => {
    if (nets[e.paidByUserId] !== undefined) {
      nets[e.paidByUserId] += e.amount;
    }
    Object.entries(e.splits).forEach(([uid, share]) => {
      if (nets[uid] !== undefined) {
        nets[uid] -= share;
      }
    });
  });

  const debtors = members
    .map(m => ({ id: m.id, name: m.username, net: nets[m.id] || 0 }))
    .filter(x => x.net < -0.01)
    .sort((a, b) => a.net - b.net);

  const creditors = members
    .map(m => ({ id: m.id, name: m.username, net: nets[m.id] || 0 }))
    .filter(x => x.net > 0.01)
    .sort((a, b) => b.net - a.net);

  const debts: PairwiseDebt[] = [];
  let dIdx = 0;
  let cIdx = 0;

  const debtorsCopy = debtors.map(d => ({ ...d }));
  const creditorsCopy = creditors.map(c => ({ ...c }));

  while (dIdx < debtorsCopy.length && cIdx < creditorsCopy.length) {
    const debtor = debtorsCopy[dIdx];
    const creditor = creditorsCopy[cIdx];

    const owe = Math.min(-debtor.net, creditor.net);
    if (owe > 0.01) {
      debts.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: owe
      });
    }

    debtor.net += owe;
    creditor.net -= owe;

    if (Math.abs(debtor.net) < 0.01) dIdx++;
    if (Math.abs(creditor.net) < 0.01) cIdx++;
  }

  return debts;
}

interface InsightItem {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  color: string;
}

function generateInsights(txs: Transaction[], goals: SavingsGoal[], user: FinanceUser): InsightItem[] {
  const items: InsightItem[] = [];
  const monthlyTxs = txs.filter(t => t.date.slice(0, 7) === new Date().toISOString().slice(0, 7));
  const income = monthlyTxs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expenses = monthlyTxs.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);

  if (income > 0 && expenses > 0) {
    const savingsRate = Math.round(((income - expenses) / income) * 100);
    if (savingsRate >= 40) {
      items.push({
        id: "frugal_master",
        emoji: "🏆",
        title: "Frugal Master",
        desc: `Your savings rate is ${savingsRate}% this month. Masterful wealth accumulation!`,
        color: C.green
      });
    } else if (savingsRate < 10) {
      items.push({
        id: "frugal_warn",
        emoji: "⚠️",
        title: "Cash Flow Warning",
        desc: `You have spent ${100 - savingsRate}% of your income. Consider pausing non-essential purchases.`,
        color: C.pink
      });
    }
  }

  if (expenses > 0) {
    const catTotalsMap: { [catId: string]: number } = {};
    monthlyTxs.filter(t => t.type === "expense").forEach(t => {
      catTotalsMap[t.category] = (catTotalsMap[t.category] || 0) + t.amount;
    });

    const largestCatEntry = Object.entries(catTotalsMap).sort((a, b) => b[1] - a[1])[0];
    if (largestCatEntry) {
      const [catId, amount] = largestCatEntry;
      const pctValue = Math.round((amount / expenses) * 100);
      const catObj = CATEGORIES.find(c => c.id === catId);
      if (pctValue >= 35 && catObj) {
        items.push({
          id: "cat_heavy",
          emoji: catObj.label.split(" ")[0] || "💰",
          title: `Heavy Category Spending`,
          desc: `You spent ${pctValue}% of your funds on ${catObj.label.slice(2)}. Try cutting back here next week.`,
          color: C.purple
        });
      }
    }
  }

  const activeGoals = goals.filter(g => g.savedAmount < g.targetAmount);
  if (activeGoals.length > 0) {
    const firstGoal = activeGoals[0];
    const contributedThisMonth = monthlyTxs
      .filter(t => t.category === "savings" && t.note?.includes(firstGoal.name))
      .reduce((a, t) => a + t.amount, 0);

    if (contributedThisMonth === 0) {
      items.push({
        id: "goal_accelerator",
        emoji: "🎯",
        title: "Goal Accelerator",
        desc: `You haven't contributed to '${firstGoal.name}' this month. Move even $10 to make progress!`,
        color: C.blue
      });
    }
  }

  if (items.length === 0) {
    items.push({
      id: "welcome_quest",
      emoji: "⚡",
      title: "Finance Quest Advisor",
      desc: "Log more daily transactions and set goals to unlock personalized wealth-building quests!",
      color: C.yellow
    });
  }

  return items;
}

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  note: string | null;
  date: string;
  userId: string;
}

interface GroupMember {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

interface GroupExpense {
  id: string;
  groupId: string;
  paidByUserId: string;
  paidByName: string;
  amount: number;
  note: string | null;
  date: string;
  splits: { [userId: string]: number };
}

interface Group {
  id: string;
  name: string;
  creatorId: string;
  members: GroupMember[];
  expenses: GroupExpense[];
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  userId: string;
  createdAt: Date;
}

// ── Constants & Visual Settings ──────────────────────────────────────────────
const C = {
  bg: "#0f0e17", card: "#1a1828", accent: "#ff6b35", yellow: "#ffd60a",
  green: "#06d6a0", blue: "#4cc9f0", purple: "#9b5de5", pink: "#f72585",
  white: "#fffffe", muted: "#a7a3c2",
};

const CATEGORIES = [
  { id: "food", label: "🍔 Food & Dining", color: C.accent },
  { id: "bills", label: "🏠 Bills & Rent", color: C.blue },
  { id: "transport", label: "🚗 Transport", color: C.yellow },
  { id: "entertainment", label: "🎮 Fun & Leisure", color: C.purple },
  { id: "savings", label: "🏦 Savings", color: C.green },
  { id: "other", label: "📦 Miscellaneous", color: C.muted },
];

const AVATARS = [
  { id: "fox", emoji: "🦊", cost: 0, label: "Starter Fox" },
  { id: "cat", emoji: "🐱", cost: 100, label: "Golden Cat" },
  { id: "dragon", emoji: "🐲", cost: 300, label: "Fire Dragon" },
  { id: "robot", emoji: "🤖", cost: 300, label: "Cyber Robot" },
  { id: "ninja", emoji: "🥷", cost: 500, label: "Shadow Ninja" },
  { id: "crown", emoji: "👑", cost: 1000, label: "Royal Crown" },
];

const THEMES = [
  { id: "default", label: "Tangerine Quest", bg: "#0f0e17", accent: "#ff6b35", cost: 0 },
  { id: "emerald", label: "Emerald Kingdom", bg: "#061411", accent: "#06d6a0", cost: 150 },
  { id: "neon", label: "Synthwave Night", bg: "#14061a", accent: "#f72585", cost: 300 },
];

const ACHIEVEMENTS = [
  { id: "first_tx", label: "First Transaction", icon: "📝", check: (u: any, txs: any[]) => txs.length >= 1 },
  { id: "five_tx", label: "5 Transactions", icon: "💪", check: (u: any, txs: any[]) => txs.length >= 5 },
  { id: "level3", label: "Level 3", icon: "⚡", check: (u: any) => u.level >= 3 },
  { id: "group", label: "Team Player", icon: "👥", check: (u: any, t: any, groups: any[]) => groups.length > 0 },
  { id: "pts500", label: "500 Points", icon: "⭐", check: (u: any) => u.points >= 500 },
  { id: "saver", label: "Savings Goal", icon: "🏦", check: (u: any, txs: any[]) => txs.some(t => t.category === "savings") },
];

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);

// ── Shared tiny components (Strongly Typed) ──────────────────────────────────
function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, background: `${color}22`,
      color, borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: 11, color: C.muted, marginBottom: 5, display: "block",
      fontWeight: 700, letterSpacing: ".07em"
    }}>
      {children}
    </label>
  );
}

function Inp({ value, onChange, placeholder, type = "text", style = {}, autoComplete, onKeyDown, name, ref }: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
  autoComplete?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  name?: string;
  ref?: React.Ref<HTMLInputElement>;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onKeyDown={onKeyDown}
      name={name}
      ref={ref}
      style={{
        background: "#ffffff0f", border: "1.5px solid #ffffff18", borderRadius: 12,
        padding: "11px 14px", color: C.white, fontSize: 14, width: "100%", outline: "none",
        boxSizing: "border-box" as const, fontFamily: "inherit", ...style
      }}
    />
  );
}

function Btn({ onClick, color, textColor, children, style = {}, disabled, type = "submit" }: {
  onClick?: () => void;
  color?: string;
  textColor?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const bg = color || C.accent;
  const tc = textColor || (bg === C.yellow ? "#000" : "#fff");
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#ffffff20" : bg, color: disabled ? C.muted : tc, border: "none",
        borderRadius: 14, padding: "12px 20px", fontWeight: 800, fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer", width: "100%", fontFamily: "inherit",
        transition: "transform .1s", ...style
      }}
    >
      {children}
    </button>
  );
}

function getLevelFromXP(totalXP: number): { level: number; levelXP: number; neededXP: number } {
  let level = 1;
  let needed = Math.floor(100 * Math.pow(level, 1.25));
  let xp = totalXP;
  while (xp >= needed) {
    xp -= needed;
    level++;
    needed = Math.floor(100 * Math.pow(level, 1.25));
  }
  return { level, levelXP: xp, neededXP: needed };
}

function XPBar({ xp }: { xp: number }) {
  const { level, levelXP, neededXP } = getLevelFromXP(xp);
  const prog = pct(levelXP, neededXP);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: C.yellow, fontWeight: 800, whiteSpace: "nowrap" as const }}>LVL {level}</span>
      <div style={{ flex: 1, height: 8, background: "#ffffff15", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${prog}%`, borderRadius: 99, transition: "width .6s ease",
          background: `linear-gradient(90deg,${C.yellow},${C.accent})`
        }} />
      </div>
      <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap" as const }}>{levelXP}/{neededXP}</span>
    </div>
  );
}

function MiniBar({ data, color }: { data: { l: string; v: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3 }}>
          <div style={{
            width: "100%", height: `${(d.v / max) * 44}px`, background: color, borderRadius: 4,
            transition: "height .4s ease", minHeight: d.v > 0 ? 4 : 0, boxShadow: d.v > 0 ? `0 0 8px ${color}55` : "none"
          }} />
          <span style={{ fontSize: 9, color: C.muted }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ segments, size = 120 }: { segments: { color: string; value: number }[]; size?: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={60} cy={60} r={r} fill="none" stroke="#ffffff10" strokeWidth={18} />
      {segments.map((s, i) => {
        const dash = (s.value / total) * circ;
        const el = (
          <circle
            key={i}
            cx={60}
            cy={60}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={18}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-off}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
          />
        );
        off += dash;
        return el;
      })}
      <text x={60} y={56} textAnchor="middle" fill={C.white} fontSize={10} fontWeight="800">SPLIT</text>
      <text x={60} y={69} textAnchor="middle" fill={C.yellow} fontSize={10} fontWeight="700">{segments.length} cats</text>
    </svg>
  );
}

function Toast({ msg, type = "success", onDone }: { msg: string; type?: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === "error" ? C.pink : type === "warn" ? C.yellow : C.green;
  return (
    <div style={{
      position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)",
      background: bg, color: type === "warn" ? "#000" : "#fff", padding: "10px 22px", borderRadius: 99,
      fontWeight: 800, fontSize: 14, zIndex: 999, boxShadow: `0 4px 24px ${bg}55`,
      animation: "fadeUp .3s ease", whiteSpace: "nowrap" as const
    }}>
      {msg}
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, confirmColor = C.accent, onConfirm, onCancel, loading }: {
  title: string;
  body: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000e0", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <div style={{
        background: C.card, borderRadius: 24, padding: 28, width: "100%", maxWidth: 360,
        border: "1px solid #ffffff12", animation: "fadeUp .25s ease", boxSizing: "border-box" as const
      }}>
        <h3 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 18 }}>{title}</h3>
        <p style={{ margin: "0 0 24px", color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{body}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={onCancel} color="#ffffff18" textColor={C.muted} style={{ flex: 1 }} disabled={loading}>Cancel</Btn>
          <Btn onClick={onConfirm} color={confirmColor} style={{ flex: 1 }} disabled={loading}>{loading ? "…" : confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

function BottomSheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="bottom-sheet-overlay" style={{
      position: "fixed", inset: 0, background: "#000000cc", zIndex: 150,
      display: "flex", alignItems: "flex-end"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bottom-sheet-content" style={{
        background: C.card, borderRadius: "24px 24px 0 0", padding: 24, width: "100%",
        maxWidth: 430, margin: "0 auto", animation: "fadeUp .3s ease", boxSizing: "border-box" as const,
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "#ffffff10", border: "none", borderRadius: 10,
            padding: "6px 12px", color: C.muted, cursor: "pointer", fontWeight: 700
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function FinanceQuest() {
  // Window width listener for responsiveness
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 850);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Auth States
  const [screen, setScreen] = useState<"login" | "app">("login");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<FinanceUser | null>(null);

  // App Core Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Refs for Login/Register key navigation
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  // Layout Navigation
  const [tab, setTab] = useState<"dashboard" | "transactions" | "groups" | "goals" | "profile">("dashboard");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Action Form Modals
  const [showTxForm, setShowTxForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showContributeForm, setShowContributeForm] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Custom dialogs & toasts
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    color: string;
    onConfirm: () => void;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null);

  // Local Form Inputs
  const [txForm, setTxForm] = useState({
    type: "expense" as "expense" | "income",
    amount: "",
    category: "food",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [groupName, setGroupName] = useState("");
  const [groupExpForm, setGroupExpForm] = useState({ amount: "", note: "", paidByUserId: "" });
  
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "" });
  const [contributeAmount, setContributeAmount] = useState("");

  // Group member search inputs
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);

  // Category Budget states
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetInputs, setBudgetInputs] = useState<{ [catId: string]: string }>({});

  // Derived Values
  const theme = THEMES.find(t => t.id === currentUser?.theme) || THEMES[0];
  const avatarObj = AVATARS.find(a => a.id === currentUser?.avatar) || AVATARS[0];
  const activeGrp = groups.find(g => g.id === activeGroup);

  const showToast = (msg: string, type = "success") => setToast({ msg, type });

  // ── Reward XP & points (saves to DB via apiUpdateUser) ────────────────────
  async function awardXP(amount: number) {
    if (!currentUser) return;
    const newXP = currentUser.xp + amount;
    const { level: newLevel } = getLevelFromXP(newXP);
    const newPoints = currentUser.points + Math.floor(amount / 2);
    const next = { ...currentUser, xp: newXP, level: newLevel, points: newPoints };
    setCurrentUser(next);
    await apiUpdateUser(currentUser.id, { xp: newXP, level: newLevel, points: newPoints });
  }

  // Load user data on startup/login
  async function loadData(user: FinanceUser) {
    setDataLoading(true);
    const [txRes, grpRes, goalRes] = await Promise.all([
      apiGetTransactions(user.id),
      apiGetGroups(user.id),
      apiGetSavingsGoals(user.id)
    ]);
    setTransactions(
      (txRes.transactions || []).map((t: any) => ({
        id: t.id,
        amount: t.amount,
        type: t.type as "income" | "expense",
        category: t.category,
        note: t.note,
        date: t.date,
        userId: t.userId,
      }))
    );
    setGroups(grpRes.groups || []);
    setSavingsGoals(goalRes.goals || []);
    setDataLoading(false);
  }

  // Restore session on mount
  useEffect(() => {
    (async () => {
      setDataLoading(true);
      const res = await apiGetSessionUser();
      if (res.user) {
        setCurrentUser(res.user);
        await loadData(res.user);
        setScreen("app");
      }
      setDataLoading(false);
    })();
  }, []);

  // ── AUTH HANDLERS ─────────────────────────────────────────────────────────
  async function handleLogin() {
    setAuthLoading(true);
    setAuthError("");
    const res = await apiLogin(authForm.email, authForm.password);
    setAuthLoading(false);
    if (res.error || !res.user) return setAuthError(res.error || "Wrong email or password.");

    setCurrentUser(res.user);
    await loadData(res.user);
    setScreen("app");
  }

  async function handleRegister() {
    if (!authForm.username || !authForm.email || !authForm.password)
      return setAuthError("Please fill in all fields.");

    setAuthLoading(true);
    setAuthError("");
    const res = await apiRegister(authForm.username, authForm.email, authForm.password);
    setAuthLoading(false);

    if (res.error || !res.user) return setAuthError(res.error || "Registration failed.");

    setCurrentUser(res.user);
    setTransactions([]);
    setGroups([]);
    setSavingsGoals([]);
    setScreen("app");
    showToast("🎉 Account created! Here's 50 bonus points!");
  }

  function handleLogout() {
    setConfirm({
      title: "Log Out?",
      body: "You'll need to sign back in to access your data.",
      confirmLabel: "Log Out",
      color: C.pink,
      onConfirm: async () => {
        setConfirmLoading(true);
        await apiLogout();
        setConfirmLoading(false);
        setConfirm(null);
        setCurrentUser(null);
        setTransactions([]);
        setGroups([]);
        setSavingsGoals([]);
        setTab("dashboard");
        setScreen("login");
        setShowSettings(false);
        setAuthForm({ username: "", email: "", password: "" });
      },
    });
  }

  // ── TRANSACTION HANDLERS ──────────────────────────────────────────────────
  async function handleAddTx() {
    if (!txForm.amount || isNaN(Number(txForm.amount)) || !currentUser) return;
    const res = await apiAddTransaction(currentUser, {
      ...txForm,
      amount: parseFloat(txForm.amount)
    });

    if (res.error || !res.transaction) {
      showToast(`❌ ${res.error || "Failed to save transaction"}`, "error");
      return;
    }

    const tx: Transaction = {
      id: res.transaction.id,
      amount: res.transaction.amount,
      type: res.transaction.type as "income" | "expense",
      category: res.transaction.category,
      note: res.transaction.note,
      date: res.transaction.date,
      userId: res.transaction.userId,
    };

    setTransactions(prev => [tx, ...prev]);
    setShowTxForm(false);
    setTxForm({ type: "expense", amount: "", category: "food", note: "", date: new Date().toISOString().split("T")[0] });
    await awardXP(20);
    showToast("✅ Saved! +20 XP");
  }

  function confirmDeleteTx(id: string) {
    setConfirm({
      title: "Delete Transaction?",
      body: "This action can't be undone.",
      confirmLabel: "Delete",
      color: C.pink,
      onConfirm: async () => {
        setConfirmLoading(true);
        await apiDeleteTransaction(id);
        setTransactions(p => p.filter(t => t.id !== id));
        setConfirmLoading(false);
        setConfirm(null);
        showToast("🗑️ Deleted", "warn");
      },
    });
  }

  // ── GROUP HANDLERS ────────────────────────────────────────────────────────
  async function handleCreateGroup() {
    if (!groupName.trim() || !currentUser) return;
    const res = await apiCreateGroup(groupName, currentUser.id);
    setGroups(p => [...p, res.group]);
    setShowGroupForm(false);
    setGroupName("");
    await awardXP(30);
    showToast("👥 Group created! +30 XP");
  }

  // Debounced email search for group invites
  useEffect(() => {
    if (memberQuery.length < 2) {
      setMemberResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setMemberSearching(true);
      const res = await apiSearchUsers(memberQuery);
      const existing = activeGrp?.members.map(m => m.id) || [];
      setMemberResults((res.users || []).filter((u: any) => !existing.includes(u.id) && u.id !== currentUser?.id));
      setMemberSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [memberQuery, activeGrp, currentUser]);

  async function handleAddMember(userId: string, username: string) {
    if (!activeGroup) return;
    const res = await apiAddGroupMember(activeGroup, userId);
    if (res.error || !res.member) return showToast(`❌ ${res.error || "Failed to add member"}`, "error");
    const member = res.member as GroupMember;
    setGroups(p => p.map(g => g.id === activeGroup ? { ...g, members: [...g.members, member] } : g));
    setMemberQuery("");
    setMemberResults([]);
    showToast(`✅ ${username} added!`);
  }

  async function handleAddGroupExpense() {
    if (!groupExpForm.amount || !groupExpForm.paidByUserId || !activeGroup) return;
    const g = groups.find(g => g.id === activeGroup);
    if (!g) return;

    const share = parseFloat(groupExpForm.amount) / g.members.length;
    const splits: { [key: string]: number } = {};
    g.members.forEach(m => splits[m.id] = share);
    const payer = g.members.find(m => m.id === groupExpForm.paidByUserId);

    const res = await apiAddGroupExpense(activeGroup, {
      paidByUserId: groupExpForm.paidByUserId,
      paidByName: payer?.username || "?",
      amount: parseFloat(groupExpForm.amount),
      note: groupExpForm.note,
      date: new Date().toISOString().split("T")[0],
      splits,
    });

    setGroups(p => p.map(g => g.id === activeGroup ? { ...g, expenses: [...g.expenses, res.expense] } : g));
    setGroupExpForm({ amount: "", note: "", paidByUserId: "" });
    await awardXP(15);
    showToast("💸 Expense added! +15 XP");
  }

  // ── SAVINGS GOALS HANDLERS (NEW FEATURE) ──────────────────────────────────
  async function handleCreateGoal() {
    if (!goalForm.name.trim() || !goalForm.targetAmount || isNaN(Number(goalForm.targetAmount)) || !currentUser) return;
    const res = await apiCreateSavingsGoal(currentUser.id, goalForm.name, goalForm.targetAmount);
    if (res.error || !res.goal) return showToast(`❌ ${res.error || "Failed to create savings goal"}`, "error");

    const goal = res.goal as SavingsGoal;
    setSavingsGoals(p => [goal, ...p]);
    setShowGoalForm(false);
    setGoalForm({ name: "", targetAmount: "" });
    await awardXP(30);
    showToast("🎯 Savings Goal created! +30 XP");
  }

  async function handleContributeGoal(goalId: string) {
    if (!contributeAmount || isNaN(Number(contributeAmount)) || !currentUser) return;
    const amt = parseFloat(contributeAmount);

    if (balance < amt) {
      showToast("❌ Insufficient balance for this contribution.", "error");
      return;
    }

    const res = await apiContributeToSavingsGoal(currentUser.id, goalId, amt);
    if (res.error || !res.goal || !res.transaction) return showToast(`❌ ${res.error || "Failed to contribute"}`, "error");

    const goal = res.goal as SavingsGoal;
    const tx: Transaction = {
      id: res.transaction.id,
      amount: res.transaction.amount,
      type: res.transaction.type as "income" | "expense",
      category: res.transaction.category,
      note: res.transaction.note,
      date: res.transaction.date,
      userId: res.transaction.userId,
    };

    setSavingsGoals(p => p.map(g => g.id === goalId ? goal : g));
    setTransactions(p => [tx, ...p]);
    setContributeAmount("");
    setShowContributeForm(null);
    await awardXP(25);
    showToast(`🏦 Contributed ${fmt(amt)}! +25 XP`);
  }

  function confirmDeleteGoal(id: string) {
    setConfirm({
      title: "Delete Goal?",
      body: "This removes the goal. Your contributed funds remain inside your transaction history.",
      confirmLabel: "Delete",
      color: C.pink,
      onConfirm: async () => {
        setConfirmLoading(true);
        await apiDeleteSavingsGoal(id);
        setSavingsGoals(p => p.filter(g => g.id !== id));
        setConfirmLoading(false);
        setConfirm(null);
        showToast("🗑️ Goal deleted", "warn");
      }
    });
  }

  // Budget Limit Config
  useEffect(() => {
    if (currentUser && showBudgetForm) {
      const inputs: { [catId: string]: string } = {};
      CATEGORIES.forEach(c => {
        inputs[c.id] = String(currentUser.budgetLimits[c.id] || "");
      });
      setBudgetInputs(inputs);
    }
  }, [showBudgetForm, currentUser]);

  async function handleSaveBudgets() {
    if (!currentUser) return;
    const limits: Record<string, number> = {};
    CATEGORIES.forEach(c => {
      const val = parseFloat(budgetInputs[c.id] || "0");
      if (val > 0) limits[c.id] = val;
    });

    const res = await apiUpdateBudgetLimits(currentUser.id, limits);
    if (res.error || !res.user) {
      showToast(`❌ ${res.error || "Failed to update budgets"}`, "error");
      return;
    }

    setCurrentUser(res.user);
    setShowBudgetForm(false);
    await awardXP(15);
    showToast("🎯 Monthly budgets updated! +15 XP");
  }

  async function handleSettleUp(debt: PairwiseDebt) {
    if (!activeGroup || !currentUser) return;
    const g = groups.find(g => g.id === activeGroup);
    if (!g) return;

    setConfirm({
      title: "Settle Up Debt?",
      body: `Record a payment of ${fmt(debt.amount)} from ${debt.fromName} to ${debt.toName}?`,
      confirmLabel: "Settle Up",
      color: C.green,
      onConfirm: async () => {
        setConfirmLoading(true);
        const splits = { [debt.toId]: debt.amount };
        const res = await apiAddGroupExpense(activeGroup, {
          paidByUserId: debt.fromId,
          paidByName: debt.fromName,
          amount: debt.amount,
          note: `🤝 Settled: ${debt.fromName} → ${debt.toName}`,
          date: new Date().toISOString().split("T")[0],
          splits,
        });

        setGroups(p => p.map(group => group.id === activeGroup ? { ...group, expenses: [...group.expenses, res.expense] } : group));
        setConfirm(null);
        setConfirmLoading(false);
        await awardXP(15);
        showToast("🤝 Debt settled! +15 XP");
      }
    });
  }

  // ── GAMIFIED SHOP HANDLERS ────────────────────────────────────────────────
  function handleShopBuy(itemType: "avatar" | "theme", item: any) {
    if (!currentUser) return;
    const owned = itemType === "avatar" 
      ? currentUser.unlockedAvatars.includes(item.id) 
      : currentUser.unlockedThemes.includes(item.id);
    const active = itemType === "avatar" 
      ? currentUser.avatar === item.id 
      : currentUser.theme === item.id;
    
    if (active) return;
    setConfirm({
      title: owned ? `Equip ${item.label || item.emoji}?` : `Buy ${item.label || item.emoji}?`,
      body: owned
        ? `Switch your active ${itemType} to this one?`
        : `This costs ⭐ ${item.cost} points. You currently have ⭐ ${currentUser.points} points.`,
      confirmLabel: owned ? "Equip" : `Buy for ⭐ ${item.cost}`,
      color: owned ? C.blue : C.accent,
      onConfirm: async () => {
        setConfirmLoading(true);
        const res = await apiPurchaseShopItem(currentUser.id, itemType, item.id, item.cost);
        setConfirmLoading(false);
        if (res.error || !res.user) {
          setConfirm(null);
          showToast(`❌ ${res.error || "Failed to purchase"}`, "error");
          return;
        }
        setCurrentUser(res.user);
        setConfirm(null);
        showToast(owned ? `✅ ${itemType} equipped!` : `🎉 ${itemType} unlocked!`);
      },
    });
  }

  // ── Financial Data Crunching ──────────────────────────────────────────────
  const income = transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const balance = income - expenses;

  const catTotals = CATEGORIES.map(c => ({
    ...c,
    value: transactions.filter(t => t.category === c.id && t.type === "expense").reduce((a, t) => a + t.amount, 0)
  })).filter(c => c.value > 0);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    return {
      l: d.toLocaleDateString("en", { weekday: "short" }),
      v: transactions.filter(t => t.date === key && t.type === "expense").reduce((a, t) => a + t.amount, 0)
    };
  });

  // ── Local Styles (Cast as CSSProperties) ──────────────────────────────────
  const card: React.CSSProperties = {
    background: C.card, borderRadius: 20, padding: "18px 20px",
    marginBottom: 14, border: "1px solid #ffffff08"
  };
  
  const sel: React.CSSProperties = {
    background: "#ffffff0f", border: "1.5px solid #ffffff18", borderRadius: 12,
    padding: "11px 14px", color: C.white, fontSize: 14, width: "100%", outline: "none",
    boxSizing: "border-box" as const, fontFamily: "inherit"
  };

  const navBtn = (active: boolean) => ({
    flex: 1, padding: "10px 4px 7px", background: "none", border: "none",
    color: active ? theme.accent : C.muted, fontSize: 20, cursor: "pointer",
    borderTop: active ? `3px solid ${theme.accent}` : "3px solid transparent",
    transition: "all .2s", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2,
  });

  // ════════════════════════════════════════════════════════════════════════════
  // AUTH ROUTING VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (dataLoading && !currentUser) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg, color: C.white, fontFamily: "'Nunito',sans-serif",
        display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "center",
        padding: 24, gap: 16
      }}>
        <div style={{ fontSize: 60, animation: "pulse 1.5s infinite" }}>💰</div>
        <h2 style={{
          fontSize: 20, fontWeight: 900, margin: 0,
          background: `linear-gradient(90deg,${C.yellow},${C.accent})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>Restoring Session...</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Syncing your Quest data</p>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (screen !== "app") {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg, color: C.white, fontFamily: "'Nunito',sans-serif",
        display: "flex", flexDirection: "column" as const, justifyContent: "center", alignItems: "center",
        padding: "40px 24px"
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
          *{box-sizing:border-box;}
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          input::placeholder{color:#a7a3c244;}
          select option{background:#1a1828;}
        `}</style>
        <div style={{
          width: "100%", maxWidth: 400, background: C.card, borderRadius: 24, padding: 32,
          border: "1px solid #ffffff08", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeUp .5s ease"
        }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 50, marginBottom: 8 }}>💰</div>
            <h1 style={{
              fontSize: 30, fontWeight: 900, margin: "0 0 6px",
              background: `linear-gradient(90deg,${C.yellow},${C.accent})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>FinanceQuest</h1>
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Level up your money game</p>
          </div>
          <div style={{ display: "flex", background: "#ffffff0a", borderRadius: 14, padding: 4, marginBottom: 24 }}>
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => { setAuthTab(t); setAuthError(""); }}
                style={{
                  flex: 1, padding: 10, border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14,
                  cursor: "pointer", transition: "all .2s", fontFamily: "inherit",
                  background: authTab === t ? theme.accent : "none", color: authTab === t ? "#fff" : C.muted
                }}>
                {t === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          <form 
            onSubmit={e => {
              e.preventDefault();
              authTab === "login" ? handleLogin() : handleRegister();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {authTab === "register" && (
              <div>
                <Lbl>USERNAME</Lbl>
                <Inp 
                  placeholder="Your name" 
                  value={authForm.username}
                  autoComplete="username"
                  name="username"
                  ref={usernameRef}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      emailRef.current?.focus();
                    }
                  }}
                  onChange={e => setAuthForm(f => ({ ...f, username: e.target.value }))} 
                />
              </div>
            )}
            <div>
              <Lbl>EMAIL</Lbl>
              <Inp 
                placeholder="you@email.com" 
                value={authForm.email}
                autoComplete="email"
                name="email"
                ref={emailRef}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    passwordRef.current?.focus();
                  }
                }}
                onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} 
              />
            </div>
            <div>
              <Lbl>PASSWORD</Lbl>
              <Inp 
                type="password" 
                placeholder="••••••" 
                value={authForm.password}
                autoComplete={authTab === "login" ? "current-password" : "new-password"}
                name="password"
                ref={passwordRef}
                onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} 
              />
            </div>
            {authError && <p style={{ color: C.pink, fontSize: 13, margin: 0, fontWeight: 700 }}>{authError}</p>}
            <Btn disabled={authLoading}>
              {authLoading ? "…" : authTab === "login" ? "🚀 Log In" : "🎉 Create Account"}
            </Btn>
          </form>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      color: C.white,
      fontFamily: "'Nunito',sans-serif",
      width: "100%",
      maxWidth: isMobile ? 430 : "100%",
      margin: "0 auto",
      paddingBottom: isMobile ? 88 : 24,
      display: isMobile ? "block" : "flex",
      gap: isMobile ? 0 : 32,
      padding: isMobile ? 0 : "32px 24px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
        *{box-sizing:border-box;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder{color:#a7a3c255;}
        select option{background:#1a1828;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#ffffff20;border-radius:99px;}
        
        /* Desktop bottom sheet overrides */
        @media (min-width: 850px) {
          .bottom-sheet-overlay {
            align-items: center !important;
          }
          .bottom-sheet-content {
            border-radius: 24px !important;
            max-height: 85vh !important;
            border: 1px solid #ffffff12 !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6) !important;
          }
        }
        
        /* Sidebar item hover effects */
        .sidebar-btn:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #fffffe !important;
        }
        
        button {
          transition: all 0.2s ease !important;
        }
        button:active {
          transform: scale(0.98) !important;
        }
      `}</style>

      {/* ── Desktop Left Sidebar Menu ── */}
      {!isMobile && (
        <aside style={{
          width: 280,
          flexShrink: 0,
          background: C.card,
          borderRadius: 24,
          padding: 24,
          border: "1px solid #ffffff08",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          height: "calc(100vh - 64px)",
          position: "sticky",
          top: 32,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid #ffffff08" }}>
            <span style={{ fontSize: 28 }}>💰</span>
            <span style={{ fontSize: 20, fontWeight: 900, background: `linear-gradient(90deg,${C.yellow},${theme.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FinanceQuest</span>
          </div>

          {/* User Status Card */}
          <div style={{ background: "#ffffff04", borderRadius: 18, padding: 16, border: "1px solid #ffffff08" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 36 }}>{avatarObj.emoji}</span>
              <div style={{ overflow: "hidden" }}>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: 16, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{currentUser.username}</h4>
                <span style={{ fontSize: 11, color: C.muted, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", display: "block" }}>{currentUser.email}</span>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <Pill color={C.yellow}>⭐ {currentUser.points} pts</Pill>
              <Pill color={C.accent}>🔥 {currentUser.streak} streak</Pill>
            </div>
            
            <XPBar xp={currentUser.xp} />
          </div>

          {/* Nav Items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {[
              { id: "dashboard", icon: "📊", label: "Dashboard" },
              { id: "transactions", icon: "💳", label: "Transactions" },
              { id: "groups", icon: "👥", label: "Groups Ledger" },
              { id: "goals", icon: "🎯", label: "Savings Goals" },
              { id: "profile", icon: "🎮", label: "Profile & Shop" },
            ].map(item => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  className="sidebar-btn"
                  onClick={() => {
                    setTab(item.id as any);
                    setActiveGroup(null);
                    setMemberQuery("");
                    setMemberResults([]);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: active ? `${theme.accent}15` : "transparent",
                    color: active ? theme.accent : C.muted,
                    border: "none",
                    borderRadius: 14,
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: 14,
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Settings & Logout */}
          <div style={{ display: "flex", gap: 10, borderTop: "1px solid #ffffff08", paddingTop: 16 }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px",
                background: "#ffffff0a",
                color: C.white,
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ff000015",
                color: C.pink,
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 16,
              }}
              title="Logout"
            >
              🚪
            </button>
          </div>
        </aside>
      )}

      {/* ── Main View Panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── Mobile Dashboard Header Status Bar ── */}
        {isMobile && (
          <>
            <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: ".08em" }}>WELCOME BACK</p>
                <h2 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 900 }}>{avatarObj.emoji} {currentUser.username}</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Pill color={C.yellow}>⭐ {currentUser.points} pts</Pill>
                  <button onClick={() => setShowSettings(true)} style={{
                    background: "#ffffff12", border: "none",
                    borderRadius: 12, width: 34, height: 34, cursor: "pointer", fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>⚙️</button>
                </div>
                <div style={{ width: 160 }}><XPBar xp={currentUser.xp} /></div>
              </div>
            </div>
            <div style={{ padding: "8px 20px 0" }}><Pill color={C.accent}>🔥 {currentUser.streak}-day streak</Pill></div>
          </>
        )}

        {/* ── MAIN TABS VIEW ROUTING ── */}
        <div style={{ padding: isMobile ? "16px 16px 0" : 0 }}>

        {/* ════ DASHBOARD VIEW ════ */}
        {tab === "dashboard" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={{
              display: isMobile ? "block" : "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr",
              gap: 20,
              alignItems: "start"
            }}>
              {/* Left Column (Main Charts & Balance) */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Balance Card */}
                <div style={{
                  ...card, background: `linear-gradient(135deg,${theme.accent}cc,${C.purple}cc)`,
                  border: "none", position: "relative", overflow: "hidden", marginBottom: 16
                }}>
                  <div style={{ position: "absolute", right: -16, top: -16, fontSize: 110, opacity: .06 }}>💳</div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, opacity: .75, letterSpacing: ".07em" }}>BALANCE</p>
                  <h1 style={{ margin: "4px 0 14px", fontSize: 38, fontWeight: 900 }}>{fmt(balance)}</h1>
                  <div style={{ display: "flex", gap: 20 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, opacity: .7 }}>INCOME</p>
                      <p style={{ margin: 0, fontWeight: 800, color: C.green }}>{fmt(income)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, opacity: .7 }}>EXPENSES</p>
                      <p style={{ margin: 0, fontWeight: 800, color: C.pink }}>{fmt(expenses)}</p>
                    </div>
                  </div>
                </div>

                {/* Weekly Spending Chart */}
                <div style={{ ...card, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 14 }}>📅 Weekly Spending Quest</p>
                  <div style={{ width: "100%", height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={last7} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.accent} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={theme.accent} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="l" 
                          stroke="#ffffff33" 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: C.muted, fontSize: 11, fontWeight: 700 }}
                        />
                        <ChartTooltip
                          contentStyle={{
                            background: C.card,
                            border: "1px solid #ffffff18",
                            borderRadius: 12,
                            color: C.white,
                            fontFamily: "inherit",
                            fontSize: 12
                          }}
                          itemStyle={{ color: C.yellow, fontWeight: 700 }}
                          labelFormatter={(label) => `Day: ${label}`}
                          formatter={(value: any) => [`$${value}`, "Spent"]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="v" 
                          stroke={theme.accent} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Donut Graph */}
                <div style={{ ...card, marginBottom: isMobile ? 16 : 0 }}>
                  <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14 }}>🎯 By Category</p>
                  {catTotals.length === 0
                    ? <p style={{ color: C.muted, fontSize: 13 }}>No expenses yet — add your first!</p>
                    : <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <Donut segments={catTotals.map(c => ({ color: c.color, value: c.value }))} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 7 }}>
                        {catTotals.map(c => (
                          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13 }}>{c.label}</span>
                            <Pill color={c.color}>{fmt(c.value)}</Pill>
                          </div>
                        ))}
                      </div>
                    </div>}
                </div>
              </div>

              {/* Right Column (Budgets, Quests, Recents, Action) */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Budgets Card */}
                <div style={{ ...card, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>🎯 Monthly Budgets</p>
                    <button onClick={() => setShowBudgetForm(true)} style={{
                      background: "none", border: "none", color: theme.accent, fontSize: 12,
                      fontWeight: 800, cursor: "pointer", fontFamily: "inherit"
                    }}>
                      ⚙️ Set Limits
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {CATEGORIES.map(c => {
                      const spent = transactions
                        .filter(t => t.category === c.id && t.type === "expense" && t.date.slice(0, 7) === new Date().toISOString().slice(0, 7))
                        .reduce((a, t) => a + t.amount, 0);
                      const limit = currentUser.budgetLimits[c.id] || 0;
                      if (limit === 0 && spent === 0) return null;
                      const ratio = limit > 0 ? (spent / limit) * 100 : 0;
                      const barColor = ratio >= 100 ? C.pink : ratio >= 80 ? C.yellow : C.green;
                      return (
                        <div key={c.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700 }}>{c.label}</span>
                            <span style={{ color: ratio >= 100 ? C.pink : C.muted, fontWeight: 700 }}>
                              {fmt(spent)} / {limit > 0 ? fmt(limit) : "No Limit"}
                            </span>
                          </div>
                          <div style={{ height: 6, background: "#ffffff15", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", width: `${Math.min(100, limit > 0 ? ratio : (spent > 0 ? 100 : 0))}%`,
                              borderRadius: 99, background: barColor, transition: "width .4s ease"
                            }} />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(currentUser.budgetLimits).length === 0 && (
                      <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Configure budget limits to gamify your spending control!</p>
                    )}
                  </div>
                </div>

                {/* Quest Advisor / Financial Insights */}
                <div style={{ ...card, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14 }}>⚡ Quest Insights</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {generateInsights(transactions, savingsGoals, currentUser).map(item => (
                      <div key={item.id} style={{
                        display: "flex", gap: 12, padding: 12, borderRadius: 14,
                        background: `${item.color}0a`, border: `1px solid ${item.color}18`
                      }}>
                        <span style={{ fontSize: 24 }}>{item.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 3px", fontWeight: 800, fontSize: 13, color: item.color }}>{item.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Transaction Button */}
                <Btn onClick={() => setShowTxForm(true)} style={{ marginBottom: 16 }}>➕ Add Transaction</Btn>

                {/* Recent Items List */}
                <div style={{ ...card, marginBottom: 0 }}>
                  <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14 }}>🕐 Recent Activities</p>
                  {transactions.slice(0, 5).map(t => {
                    const cat = CATEGORIES.find(c => c.id === t.category);
                    return (
                      <div key={t.id} style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: "9px 0", borderBottom: "1px solid #ffffff08"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 12, background: `${cat?.color}22`,
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19
                          }}>
                            {cat?.label.split(" ")[0]}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{t.note || cat?.label}</p>
                            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{t.date}</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 900, color: t.type === "income" ? C.green : C.pink }}>
                          {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ TRANSACTIONS LIST VIEW ════ */}
        {tab === "transactions" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={{
              display: isMobile ? "block" : "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr",
              gap: 20,
              alignItems: "start"
            }}>
              {/* Transactions List Column */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20 }}>All Transactions</h3>
                  {isMobile && (
                    <button onClick={() => setShowTxForm(true)} style={{
                      background: theme.accent, color: "#fff",
                      border: "none", borderRadius: 12, padding: "8px 16px", fontWeight: 800, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit"
                    }}>➕ Add</button>
                  )}
                </div>
                {transactions.length === 0 && <p style={{ color: C.muted }}>No transactions yet.</p>}
                {transactions.map(t => {
                  const cat = CATEGORIES.find(c => c.id === t.category);
                  return (
                    <div key={t.id} style={{
                      ...card, display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "14px 16px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 14, background: `${cat?.color}22`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21
                        }}>
                          {cat?.label.split(" ")[0]}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700 }}>{t.note || cat?.label}</p>
                          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                            <Pill color={cat?.color || "#fff"}>{cat?.label.slice(2)}</Pill>
                            <span style={{ fontSize: 11, color: C.muted }}>{t.date}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 900, fontSize: 16, color: t.type === "income" ? C.green : C.pink }}>
                          {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                        </span>
                        <button onClick={() => confirmDeleteTx(t.id)} style={{
                          background: "#ff000020",
                          border: "none", borderRadius: 8, padding: "4px 8px", color: C.pink,
                          cursor: "pointer", fontSize: 13
                        }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Quick Add Column */}
              {!isMobile && (
                <div style={{ ...card, position: "sticky", top: 32 }}>
                  <h3 style={{ margin: "0 0 16px", fontWeight: 900, fontSize: 18 }}>➕ Quick Add Transaction</h3>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {(["expense", "income"] as const).map(type => (
                      <button key={type} onClick={() => setTxForm(f => ({ ...f, type }))}
                        style={{
                          flex: 1, padding: 10, border: "none", borderRadius: 12, fontWeight: 800,
                          cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all .2s",
                          background: txForm.type === type ? (type === "income" ? C.green : C.pink) : "#ffffff15",
                          color: txForm.type === type ? "#fff" : C.muted
                        }}>
                        {type === "income" ? "💚 Income" : "❤️ Expense"}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <Lbl>AMOUNT</Lbl>
                      <Inp placeholder="0" type="number" value={txForm.amount}
                        onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <div>
                      <Lbl>CATEGORY</Lbl>
                      <select style={sel} value={txForm.category}
                        onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <Lbl>NOTE (optional)</Lbl>
                      <Inp placeholder="What was it?" value={txForm.note}
                        onChange={e => setTxForm(f => ({ ...f, note: e.target.value }))} />
                    </div>
                    <div>
                      <Lbl>DATE</Lbl>
                      <Inp type="date" value={txForm.date}
                        onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <Btn onClick={handleAddTx}>Save Transaction</Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ GROUPS & SPLIT BILL VIEW ════ */}
        {tab === "groups" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            {activeGrp ? (
              <div>
                <button onClick={() => { setActiveGroup(null); setMemberQuery(""); setMemberResults([]); }}
                  style={{
                    background: "none", border: "none", color: theme.accent, fontWeight: 800,
                    cursor: "pointer", fontSize: 14, marginBottom: 14, padding: 0, fontFamily: "inherit"
                  }}>
                  ← Back to groups
                </button>

                <div style={{
                  display: isMobile ? "block" : "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr",
                  gap: 20,
                  alignItems: "start"
                }}>
                  {/* Left Column: Stats, ledger, history */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* Header Card */}
                    <div style={card}>
                      <h3 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 20 }}>{activeGrp.name}</h3>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                        {activeGrp.members.map(m => <Pill key={m.id} color={C.blue}>{m.username}</Pill>)}
                      </div>
                      {(() => {
                        const myShare = activeGrp.expenses.reduce((a, e) => a + (e.splits[currentUser.id] || 0), 0);
                        const iPaid = activeGrp.expenses.reduce((a, e) => a + (e.paidByUserId === currentUser.id ? e.amount : 0), 0);
                        return (
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ ...card, flex: 1, padding: "10px 14px", marginBottom: 0 }}>
                              <p style={{ margin: 0, fontSize: 10, color: C.muted }}>YOU OWE</p>
                              <p style={{ margin: 0, fontWeight: 900, color: C.pink, fontSize: 18 }}>{fmt(Math.max(0, myShare - iPaid))}</p>
                            </div>
                            <div style={{ ...card, flex: 1, padding: "10px 14px", marginBottom: 0 }}>
                              <p style={{ margin: 0, fontSize: 10, color: C.muted }}>YOU&apos;RE OWED</p>
                              <p style={{ margin: 0, fontWeight: 900, color: C.green, fontSize: 18 }}>{fmt(Math.max(0, iPaid - myShare))}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Ledger Card */}
                    {(() => {
                      const debts = calculateDebts(activeGrp.members, activeGrp.expenses);
                      return (
                        <div style={card}>
                          <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 13 }}>⚖️ Debts & Settlements</p>
                          {debts.length === 0 ? (
                            <p style={{ color: C.green, fontSize: 13, margin: 0, fontWeight: 700 }}>🎉 Everyone is settled up!</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {debts.map((d, idx) => {
                                const isMeDebtor = d.fromId === currentUser.id;
                                const isMeCreditor = d.toId === currentUser.id;
                                return (
                                  <div key={idx} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "8px 12px", background: "#ffffff05", borderRadius: 10,
                                    border: isMeDebtor ? `1px solid ${C.pink}33` : isMeCreditor ? `1px solid ${C.green}33` : "none"
                                  }}>
                                    <span style={{ fontSize: 12, lineHeight: 1.4 }}>
                                      <strong>{d.fromName}</strong> owes <strong>{d.toName}</strong>: <span style={{ color: C.yellow, fontWeight: 700 }}>{fmt(d.amount)}</span>
                                    </span>
                                    {(isMeDebtor || isMeCreditor) && (
                                      <button onClick={() => handleSettleUp(d)}
                                        style={{
                                          background: C.green, color: "#fff", border: "none",
                                          borderRadius: 8, padding: "4px 10px", fontSize: 11,
                                          fontWeight: 800, cursor: "pointer", fontFamily: "inherit"
                                        }}>
                                        Settle Up
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* History Card */}
                    <div style={card}>
                      <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 13 }}>📋 Expense History</p>
                      {activeGrp.expenses.length === 0
                        ? <p style={{ color: C.muted, fontSize: 13 }}>No expenses yet.</p>
                        : activeGrp.expenses.map(e => (
                          <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid #ffffff08" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontWeight: 700 }}>{e.note || "Expense"}</span>
                              <span style={{ color: C.yellow, fontWeight: 800 }}>{fmt(e.amount)}</span>
                            </div>
                            <p style={{ margin: "3px 0 6px", fontSize: 11, color: C.muted }}>
                              Paid by {e.paidByName} · {e.date}
                            </p>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                              {Object.entries(e.splits).map(([uid, share]) => {
                                const m = activeGrp.members.find(member => member.id === uid);
                                return <Pill key={uid} color={C.purple}>{m?.username || uid}: {fmt(Number(share))}</Pill>;
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* Add member card */}
                    <div style={{ ...card, marginBottom: 16 }}>
                      <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 13 }}>➕ Add Member by Email</p>
                      <div style={{ position: "relative" }}>
                        <Inp placeholder="Search email or name…" value={memberQuery}
                          onChange={e => setMemberQuery(e.target.value)} />
                        {memberSearching && <span style={{
                          position: "absolute", right: 12, top: "50%",
                          transform: "translateY(-50%)", color: C.muted, fontSize: 12
                        }}>…</span>}
                      </div>
                      {memberResults.length > 0 && (
                        <div style={{
                          marginTop: 8, background: "#0f0e17", borderRadius: 12, overflow: "hidden",
                          border: "1px solid #ffffff10"
                        }}>
                          {memberResults.map(u => (
                            <div key={u.id} onClick={() => handleAddMember(u.id, u.username)}
                              style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                                borderBottom: "1px solid #ffffff08", cursor: "pointer"
                              }}>
                              <div style={{ fontSize: 22 }}>{AVATARS.find(a => a.id === u.avatar)?.emoji || "🦊"}</div>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{u.username}</p>
                                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{u.email}</p>
                              </div>
                              <span style={{ fontSize: 12, color: theme.accent, fontWeight: 700 }}>+ Add</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {memberQuery.length >= 2 && !memberSearching && memberResults.length === 0 && (
                        <p style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>No users found with that query.</p>
                      )}
                    </div>

                    {/* Add shared expense card */}
                    <div style={card}>
                      <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 13 }}>💸 Add Shared Expense</p>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                        <Inp placeholder="Amount" type="number" value={groupExpForm.amount}
                          onChange={e => setGroupExpForm(f => ({ ...f, amount: e.target.value }))} />
                        <Inp placeholder="Note (e.g. Dinner)" value={groupExpForm.note}
                          onChange={e => setGroupExpForm(f => ({ ...f, note: e.target.value }))} />
                        <select style={sel} value={groupExpForm.paidByUserId}
                          onChange={e => setGroupExpForm(f => ({ ...f, paidByUserId: e.target.value }))}>
                          <option value="">Paid by…</option>
                          {activeGrp.members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                        </select>
                        <Btn onClick={handleAddGroupExpense}>Split Equally!</Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  display: isMobile ? "block" : "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr",
                  gap: 20,
                  alignItems: "start"
                }}>
                  {/* Left Column: Groups list */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20 }}>My Groups</h3>
                      {isMobile && (
                        <button onClick={() => setShowGroupForm(true)} style={{
                          background: theme.accent, color: "#fff",
                          border: "none", borderRadius: 12, padding: "8px 16px", fontWeight: 800, fontSize: 13,
                          cursor: "pointer", fontFamily: "inherit"
                        }}>➕ New</button>
                      )}
                    </div>
                    {groups.length === 0 && (
                      <div style={{ ...card, textAlign: "center" as const, padding: 32 }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
                        <p style={{ margin: 0, color: C.muted }}>No groups yet. Create one to start splitting!</p>
                      </div>
                    )}
                    <div style={{
                      display: isMobile ? "block" : "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      gap: 12
                    }}>
                      {groups.map(g => (
                        <div key={g.id} style={{ ...card, cursor: "pointer", marginBottom: 0 }} onClick={() => setActiveGroup(g.id)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <h4 style={{ margin: "0 0 6px", fontWeight: 900 }}>{g.name}</h4>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                                {g.members.map(m => <Pill key={m.id} color={C.blue}>{m.username}</Pill>)}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" as const }}>
                              <Pill color={C.accent}>{g.expenses.length} expenses</Pill>
                              <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>
                                {fmt(g.expenses.reduce((a, e) => a + e.amount, 0))} total
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Quick Create (Desktop) */}
                  {!isMobile && (
                    <div style={{ ...card, position: "sticky", top: 32 }}>
                      <h3 style={{ margin: "0 0 16px", fontWeight: 900, fontSize: 18 }}>👥 Create New Group</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <Lbl>GROUP NAME</Lbl>
                          <Inp placeholder="e.g. 🏠 Apartment" value={groupName}
                            onChange={e => setGroupName(e.target.value)} />
                        </div>
                        <Btn onClick={handleCreateGroup}>Create Group</Btn>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ SAVINGS GOALS TAB VIEW (NEW FEATURE) ════ */}
        {tab === "goals" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={{
              display: isMobile ? "block" : "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr",
              gap: 20,
              alignItems: "start"
            }}>
              {/* Left Column: Goals list */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20 }}>Savings Goals</h3>
                  {isMobile && (
                    <button onClick={() => setShowGoalForm(true)} style={{
                      background: theme.accent, color: "#fff",
                      border: "none", borderRadius: 12, padding: "8px 16px", fontWeight: 800, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit"
                    }}>➕ New Goal</button>
                  )}
                </div>

                {savingsGoals.length === 0 && (
                  <div style={{ ...card, textAlign: "center" as const, padding: 32 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
                    <p style={{ margin: 0, color: C.muted }}>No savings goals defined yet. Create one to lock in targets!</p>
                  </div>
                )}

                <div style={{
                  display: isMobile ? "block" : "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 12
                }}>
                  {savingsGoals.map(goal => {
                    const progPercent = pct(goal.savedAmount, goal.targetAmount);
                    const completed = goal.savedAmount >= goal.targetAmount;
                    return (
                      <div key={goal.id} style={{ ...card, marginBottom: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div>
                            <h4 style={{ margin: "0 0 4px", fontWeight: 900, fontSize: 16 }}>
                              {goal.name} {completed && "🎉"}
                            </h4>
                            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                              Saved: <span style={{ color: C.green, fontWeight: 850 }}>{fmt(goal.savedAmount)}</span> of {fmt(goal.targetAmount)}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button 
                              onClick={() => setShowContributeForm(goal.id)}
                              disabled={completed}
                              style={{
                                background: completed ? "#ffffff10" : C.green,
                                color: completed ? C.muted : "#fff",
                                border: "none", borderRadius: 10, padding: "6px 12px",
                                fontSize: 12, fontWeight: 800, cursor: completed ? "not-allowed" : "pointer",
                                fontFamily: "inherit"
                              }}
                            >
                              {completed ? "Completed" : "➕ Save"}
                            </button>
                            <button onClick={() => confirmDeleteGoal(goal.id)} style={{
                              background: "#ff000020", border: "none", borderRadius: 10,
                              padding: "6px 10px", color: C.pink, cursor: "pointer", fontSize: 12
                            }}>✕</button>
                          </div>
                        </div>

                        {/* Goal Progress Bar */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 8, background: "#ffffff15", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", width: `${Math.min(100, progPercent)}%`, borderRadius: 99,
                              background: completed ? C.green : `linear-gradient(90deg,${C.blue},${C.green})`,
                              transition: "width .4s ease"
                            }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: completed ? C.green : C.muted }}>{progPercent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Create Savings Goal (Desktop) */}
              {!isMobile && (
                <div style={{ ...card, position: "sticky", top: 32 }}>
                  <h3 style={{ margin: "0 0 16px", fontWeight: 900, fontSize: 18 }}>🎯 New Savings Goal</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <Lbl>GOAL NAME</Lbl>
                      <Inp placeholder="e.g. 💻 Buy Laptop" value={goalForm.name}
                        onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <Lbl>TARGET AMOUNT ($)</Lbl>
                      <Inp placeholder="e.g. 1000" type="number" value={goalForm.targetAmount}
                        onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))} />
                    </div>
                    <Btn onClick={handleCreateGoal}>Lock Target</Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ GAMIFIED USER PROFILE VIEW ════ */}
        {tab === "profile" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={{
              display: isMobile ? "block" : "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr",
              gap: 20,
              alignItems: "start"
            }}>
              {/* Left Column: Profile Card & Achievements */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* User Profile Card */}
                <div style={{
                  ...card, textAlign: "center" as const, position: "relative",
                  background: `linear-gradient(135deg,${theme.accent}44,${C.purple}44)`,
                  marginBottom: 16
                }}>
                  {isMobile && (
                    <button onClick={() => setShowSettings(true)} style={{
                      position: "absolute", top: 14, right: 14,
                      background: "#ffffff15", border: "none", borderRadius: 10, padding: "6px 12px",
                      cursor: "pointer", color: C.white, fontWeight: 700, fontSize: 12, fontFamily: "inherit"
                    }}>
                      ⚙️ Settings
                    </button>
                  )}
                  <div style={{ fontSize: 60, marginBottom: 8 }}>{avatarObj.emoji}</div>
                  <h2 style={{ margin: "0 0 2px", fontWeight: 900 }}>{currentUser.username}</h2>
                  <p style={{ margin: "0 0 12px", color: C.muted, fontSize: 13 }}>{currentUser.email}</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 12 }}>
                    <Pill color={C.yellow}>⭐ {currentUser.points} pts</Pill>
                    <Pill color={C.accent}>🔥 {currentUser.streak} streak</Pill>
                    <Pill color={C.blue}>📊 {transactions.length} tx</Pill>
                  </div>
                  <XPBar xp={currentUser.xp} />
                </div>

                {/* Achievements list */}
                <div style={card}>
                  <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14 }}>🏆 Achievements</p>
                  {ACHIEVEMENTS.map(ach => {
                    const done = ach.check(currentUser, transactions, groups);
                    return (
                      <div key={ach.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "9px 0", borderBottom: "1px solid #ffffff08", opacity: done ? 1 : .35
                      }}>
                        <span style={{ fontSize: 22 }}>{ach.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{ach.label}</span>
                        {done && <span style={{ marginLeft: "auto" }}><Pill color={C.green}>✓ Done</Pill></span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Shops */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Avatar shop */}
                <div style={{ ...card, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14 }}>🦊 Avatar Shop</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {AVATARS.map(a => {
                      const owned = currentUser.unlockedAvatars.includes(a.id);
                      const active = currentUser.avatar === a.id;
                      return (
                        <button key={a.id} onClick={() => handleShopBuy("avatar", a)}
                          style={{
                            background: active ? `${theme.accent}33` : "#ffffff0a",
                            border: active ? `2px solid ${theme.accent}` : "2px solid transparent",
                            borderRadius: 14, padding: 12, cursor: "pointer", textAlign: "center" as const,
                            transition: "all .2s", fontFamily: "inherit"
                          }}>
                          <div style={{ fontSize: 30 }}>{a.emoji}</div>
                          <div style={{
                            fontSize: 11, fontWeight: 700, marginTop: 5,
                            color: active ? theme.accent : owned ? C.green : C.muted
                          }}>
                            {active ? "✓ Equipped" : owned ? "Equip" : `⭐ ${a.cost}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Theme shop */}
                <div style={card}>
                  <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14 }}>🎨 Theme Shop</p>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {THEMES.map(t => {
                      const owned = currentUser.unlockedThemes.includes(t.id);
                      const active = currentUser.theme === t.id;
                      return (
                        <button key={t.id} onClick={() => handleShopBuy("theme", t)}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: active ? `${t.accent}22` : "#ffffff08",
                            border: active ? `2px solid ${t.accent}` : "2px solid transparent",
                            borderRadius: 14, padding: "12px 16px", cursor: "pointer", transition: "all .2s",
                            fontFamily: "inherit"
                          }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: "50%", background: t.accent,
                              boxShadow: `0 0 8px ${t.accent}88`
                            }} />
                            <span style={{ color: C.white, fontWeight: 800 }}>{t.label}</span>
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: active ? t.accent : owned ? C.green : C.muted
                          }}>
                            {active ? "✓ Active" : owned ? "Apply" : `⭐ ${t.cost}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* ── Fixed Bottom Navigation Bar ── */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, background: C.card, borderTop: "1px solid #ffffff0f",
          display: "flex", zIndex: 50
        }}>
          {[
            { id: "dashboard", icon: "📊", label: "Home" },
            { id: "transactions", icon: "💳", label: "Txns" },
            { id: "groups", icon: "👥", label: "Groups" },
            { id: "goals", icon: "🎯", label: "Goals" },
            { id: "profile", icon: "🎮", label: "Profile" },
          ].map(t => (
            <button key={t.id} style={navBtn(tab === t.id)}
              onClick={() => { setTab(t.id as any); setActiveGroup(null); setMemberQuery(""); setMemberResults([]); }}>
              <span>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ════ SETTINGS MODAL ════ */}
      {showSettings && (
        <BottomSheet title="⚙️ Settings" onClose={() => setShowSettings(false)}>
          <div style={card}>
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 13 }}>Account</p>
            <p style={{ margin: 0, color: C.white, fontWeight: 700 }}>{currentUser.username}</p>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>{currentUser.email}</p>
          </div>
          <div style={card}>
            <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 13 }}>Stats Summary</p>
            {[
              ["📊 Transactions", transactions.length],
              ["👥 Groups", groups.length],
              ["🎯 Savings Goals", savingsGoals.length],
              ["⭐ Points Balance", currentUser.points],
              ["⚡ Quest Level", currentUser.level],
              ["🔥 Active Streak", `${currentUser.streak} days`],
            ].map(([k, v]) => (
              <div key={k as string} style={{
                display: "flex", justifyContent: "space-between", padding: "7px 0",
                borderBottom: "1px solid #ffffff08", fontSize: 14
              }}>
                <span style={{ color: C.muted }}>{k}</span>
                <span style={{ fontWeight: 800 }}>{v}</span>
              </div>
            ))}
          </div>
          <Btn onClick={handleLogout} color={C.pink}>🚪 Log Out</Btn>
          <div style={{ height: 12 }} />
        </BottomSheet>
      )}

      {/* ════ ADD TRANSACTION FORM ════ */}
      {showTxForm && (
        <BottomSheet title="➕ Add Transaction" onClose={() => setShowTxForm(false)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {(["expense", "income"] as const).map(type => (
              <button key={type} onClick={() => setTxForm(f => ({ ...f, type }))}
                style={{
                  flex: 1, padding: 10, border: "none", borderRadius: 12, fontWeight: 800,
                  cursor: "pointer", fontSize: 14, fontFamily: "inherit", transition: "all .2s",
                  background: txForm.type === type ? (type === "income" ? C.green : C.pink) : "#ffffff15",
                  color: txForm.type === type ? "#fff" : C.muted
                }}>
                {type === "income" ? "💚 Income" : "❤️ Expense"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <div>
              <Lbl>AMOUNT</Lbl>
              <Inp placeholder="0" type="number" value={txForm.amount}
                onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <Lbl>CATEGORY</Lbl>
              <select style={sel} value={txForm.category}
                onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Lbl>NOTE (optional)</Lbl>
              <Inp placeholder="What was it?" value={txForm.note}
                onChange={e => setTxForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div>
              <Lbl>DATE</Lbl>
              <Inp type="date" value={txForm.date}
                onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <Btn onClick={handleAddTx}>Save Transaction</Btn>
            <Btn onClick={() => setShowTxForm(false)} color="#ffffff15" textColor={C.muted}>Cancel</Btn>
          </div>
          <div style={{ height: 8 }} />
        </BottomSheet>
      )}

      {/* ════ CREATE GROUP FORM ════ */}
      {showGroupForm && (
        <BottomSheet title="👥 New Group" onClose={() => setShowGroupForm(false)}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <div>
              <Lbl>GROUP NAME</Lbl>
              <Inp placeholder="e.g. 🏠 Apartment" value={groupName}
                onChange={e => setGroupName(e.target.value)} />
            </div>
            <Btn onClick={handleCreateGroup}>Create Group</Btn>
            <Btn onClick={() => setShowGroupForm(false)} color="#ffffff15" textColor={C.muted}>Cancel</Btn>
          </div>
          <div style={{ height: 8 }} />
        </BottomSheet>
      )}

      {/* ════ CREATE SAVINGS GOAL FORM (NEW FEATURE) ════ */}
      {showGoalForm && (
        <BottomSheet title="🎯 New Savings Goal" onClose={() => setShowGoalForm(false)}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <div>
              <Lbl>GOAL NAME</Lbl>
              <Inp placeholder="e.g. 💻 Buy Laptop" value={goalForm.name}
                onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Lbl>TARGET AMOUNT ($)</Lbl>
              <Inp placeholder="e.g. 1000" type="number" value={goalForm.targetAmount}
                onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))} />
            </div>
            <Btn onClick={handleCreateGoal}>Lock Target</Btn>
            <Btn onClick={() => setShowGoalForm(false)} color="#ffffff15" textColor={C.muted}>Cancel</Btn>
          </div>
          <div style={{ height: 8 }} />
        </BottomSheet>
      )}

      {/* ════ CONTRIBUTE TO SAVINGS GOAL FORM (NEW FEATURE) ════ */}
      {showContributeForm && (
        <BottomSheet title="🏦 Contribute Savings" onClose={() => setShowContributeForm(null)}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <div>
              <Lbl>CONTRIBUTION AMOUNT ($)</Lbl>
              <Inp placeholder="e.g. 50" type="number" value={contributeAmount}
                onChange={e => setContributeAmount(e.target.value)} />
              <p style={{ margin: "6px 0 0", fontSize: 11, color: C.muted }}>
                Available Balance: <span style={{ color: C.green, fontWeight: 700 }}>{fmt(balance)}</span>
              </p>
            </div>
            <Btn onClick={() => handleContributeGoal(showContributeForm)}>Transfer to Savings</Btn>
            <Btn onClick={() => setShowContributeForm(null)} color="#ffffff15" textColor={C.muted}>Cancel</Btn>
          </div>
          <div style={{ height: 8 }} />
        </BottomSheet>
      )}

      {/* ════ CONFIGURE BUDGETS FORM ════ */}
      {showBudgetForm && (
        <BottomSheet title="🎯 Configure Category Budgets" onClose={() => setShowBudgetForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CATEGORIES.map(c => (
              <div key={c.id}>
                <Lbl>{c.label.toUpperCase()}</Lbl>
                <Inp
                  placeholder="No limit"
                  type="number"
                  value={budgetInputs[c.id] || ""}
                  onChange={e => setBudgetInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ height: 6 }} />
            <Btn onClick={handleSaveBudgets}>Save Budget Limits</Btn>
            <Btn onClick={() => setShowBudgetForm(false)} color="#ffffff15" textColor={C.muted}>Cancel</Btn>
          </div>
          <div style={{ height: 8 }} />
        </BottomSheet>
      )}

      {/* ════ CONFIRM DIALOG ════ */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          confirmColor={confirm.color}
          loading={confirmLoading}
          onConfirm={confirm.onConfirm}
          onCancel={() => !confirmLoading && setConfirm(null)}
        />
      )}

      {/* Local Toast Alert */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}