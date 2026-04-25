// FinanceQuest — Main App Component
// Designed for Next.js. All backend calls go through the API layer
// in financequest-api.js. Replace mock bodies with real fetch() calls.
"use client";
import { useState, useEffect } from "react";
import {
  apiLogin, apiRegister, apiLogout,
  apiSearchUsers,
  apiGetTransactions, apiAddTransaction, apiDeleteTransaction,
  apiGetGroups, apiCreateGroup, apiAddGroupMember, apiAddGroupExpense,
  apiUpdateUser, apiPurchaseShopItem,
} from "@/app/api/finance/route";
import { NextResponse } from "next/server";
import { FinanceUser } from "@prisma/client";

// ── Constants ──────────────────────────────────────────────────────────────────
const C = {
  bg:"#0f0e17", card:"#1a1828", accent:"#ff6b35", yellow:"#ffd60a",
  green:"#06d6a0", blue:"#4cc9f0", purple:"#9b5de5", pink:"#f72585",
  white:"#fffffe", muted:"#a7a3c2",
};

const CATEGORIES = [
  { id:"food",      label:"🍜 Food",      color:"#ff6b35" },
  { id:"transport", label:"🚌 Transport",  color:"#4cc9f0" },
  { id:"shopping",  label:"🛍️ Shopping",  color:"#f72585" },
  { id:"rent",      label:"🏠 Rent",       color:"#9b5de5" },
  { id:"health",    label:"💊 Health",     color:"#06d6a0" },
  { id:"fun",       label:"🎮 Fun",        color:"#ffd60a" },
  { id:"savings",   label:"💰 Savings",    color:"#06d6a0" },
  { id:"other",     label:"📦 Other",      color:"#a7a3c2" },
];

const THEMES = [
  { id:"default", label:"🌑 Dark",   cost:0,    accent:"#ff6b35", bg:"#0f0e17" },
  { id:"ocean",   label:"🌊 Ocean",  cost:200,  accent:"#4cc9f0", bg:"#060d1a" },
  { id:"forest",  label:"🌿 Forest", cost:200,  accent:"#06d6a0", bg:"#080f0e" },
  { id:"candy",   label:"🍭 Candy",  cost:500,  accent:"#f72585", bg:"#1a0a14" },
  { id:"gold",    label:"✨ Gold",   cost:1000, accent:"#ffd60a", bg:"#0f0d00" },
];

const AVATARS = [
  { id:"fox",    emoji:"🦊", cost:0    },
  { id:"cat",    emoji:"🐱", cost:100  },
  { id:"dragon", emoji:"🐲", cost:300  },
  { id:"robot",  emoji:"🤖", cost:300  },
  { id:"ninja",  emoji:"🥷", cost:500  },
  { id:"crown",  emoji:"👑", cost:1000 },
];

const ACHIEVEMENTS = [
  { id:"first_tx",  label:"First Transaction", icon:"📝", check:(u,txs)       => txs.length >= 1 },
  { id:"five_tx",   label:"5 Transactions",    icon:"💪", check:(u,txs)       => txs.length >= 5 },
  { id:"level3",    label:"Level 3",           icon:"⚡", check:(u)           => u.level >= 3    },
  { id:"group",     label:"Team Player",       icon:"👥", check:(u,t,groups)  => groups.length > 0 },
  { id:"pts500",    label:"500 Points",        icon:"⭐", check:(u)           => u.points >= 500 },
  { id:"saver",     label:"Savings Goal",      icon:"🏦", check:(u,txs)       => txs.some(t=>t.category==="savings") },
];

const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const pct = (a,b) => b===0 ? 0 : Math.round((a/b)*100);

// ── Shared tiny components ─────────────────────────────────────────────────────
function Pill({ color, children }) {
  return <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:`${color}22`,
    color, borderRadius:99, padding:"3px 10px", fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>{children}</span>;
}
function Lbl({ children }) {
  return <label style={{ fontSize:11, color:C.muted, marginBottom:5, display:"block",
    fontWeight:700, letterSpacing:".07em" }}>{children}</label>;
}
function Inp({ value, onChange, placeholder, type="text", style={} }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ background:"#ffffff0f", border:"1.5px solid #ffffff18", borderRadius:12,
      padding:"11px 14px", color:C.white, fontSize:14, width:"100%", outline:"none",
      boxSizing:"border-box", fontFamily:"inherit", ...style }} />;
}
function Btn({ onClick, color, textColor, children, style={}, disabled }) {
  const bg = color || C.accent;
  const tc = textColor || (bg===C.yellow?"#000":"#fff");
  return <button onClick={onClick} disabled={disabled}
    style={{ background:disabled?"#ffffff20":bg, color:disabled?C.muted:tc, border:"none",
      borderRadius:14, padding:"12px 20px", fontWeight:800, fontSize:15,
      cursor:disabled?"not-allowed":"pointer", width:"100%", fontFamily:"inherit",
      transition:"transform .1s", ...style }}>{children}</button>;
}
function XPBar({ xp, level }) {
  const needed = level*100; const prog = pct(xp%needed,needed);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ fontSize:12, color:C.yellow, fontWeight:800, whiteSpace:"nowrap" }}>LVL {level}</span>
      <div style={{ flex:1, height:8, background:"#ffffff15", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${prog}%`, borderRadius:99, transition:"width .6s ease",
          background:`linear-gradient(90deg,${C.yellow},${C.accent})` }} />
      </div>
      <span style={{ fontSize:10, color:C.muted, whiteSpace:"nowrap" }}>{xp%needed}/{needed}</span>
    </div>
  );
}
function MiniBar({ data, color }) {
  const max = Math.max(...data.map(d=>d.v),1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:56 }}>
      {data.map((d,i)=>(
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <div style={{ width:"100%", height:`${(d.v/max)*44}px`, background:color, borderRadius:4,
            transition:"height .4s ease", minHeight:d.v>0?4:0, boxShadow:d.v>0?`0 0 8px ${color}55`:"none" }} />
          <span style={{ fontSize:9, color:C.muted }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}
function Donut({ segments, size=120 }) {
  const r=40; const circ=2*Math.PI*r; const total=segments.reduce((a,s)=>a+s.value,0)||1;
  let off=0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={60} cy={60} r={r} fill="none" stroke="#ffffff10" strokeWidth={18}/>
      {segments.map((s,i)=>{
        const dash=(s.value/total)*circ;
        const el=<circle key={i} cx={60} cy={60} r={r} fill="none" stroke={s.color} strokeWidth={18}
          strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-off}
          style={{ transform:"rotate(-90deg)", transformOrigin:"60px 60px" }}/>;
        off+=dash; return el;
      })}
      <text x={60} y={56} textAnchor="middle" fill={C.white} fontSize={10} fontWeight="800">SPLIT</text>
      <text x={60} y={69} textAnchor="middle" fill={C.yellow} fontSize={10} fontWeight="700">{segments.length} cats</text>
    </svg>
  );
}
function Toast({ msg, type="success", onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,2800); return ()=>clearTimeout(t); },[]);
  const bg = type==="error"?C.pink : type==="warn"?C.yellow : C.green;
  return <div style={{ position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)",
    background:bg, color:type==="warn"?"#000":"#fff", padding:"10px 22px", borderRadius:99,
    fontWeight:800, fontSize:14, zIndex:999, boxShadow:`0 4px 24px ${bg}55`,
    animation:"fadeUp .3s ease", whiteSpace:"nowrap" }}>{msg}</div>;
}
function ConfirmDialog({ title, body, confirmLabel, confirmColor=C.accent, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:C.card, borderRadius:24, padding:28, width:"100%", maxWidth:360,
        border:"1px solid #ffffff12", animation:"fadeUp .25s ease", boxSizing:"border-box" }}>
        <h3 style={{ margin:"0 0 8px", fontWeight:900, fontSize:18 }}>{title}</h3>
        <p style={{ margin:"0 0 24px", color:C.muted, fontSize:14, lineHeight:1.6 }}>{body}</p>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={onCancel} color="#ffffff18" textColor={C.muted} style={{ flex:1 }} disabled={loading}>Cancel</Btn>
          <Btn onClick={onConfirm} color={confirmColor} style={{ flex:1 }} disabled={loading}>{loading?"…":confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}
function BottomSheet({ onClose, title, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#000000cc", zIndex:150,
      display:"flex", alignItems:"flex-end" }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:24, width:"100%",
        maxWidth:430, margin:"0 auto", animation:"fadeUp .3s ease", boxSizing:"border-box",
        maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ margin:0, fontWeight:900, fontSize:18 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"#ffffff10", border:"none", borderRadius:10,
            padding:"6px 12px", color:C.muted, cursor:"pointer", fontWeight:700 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════

export default function FinanceQuest() {


  // Auth
  const [screen, setScreen]   = useState("login");   // "login" | "app"
  const [authTab, setAuthTab] = useState("login");
  const [authForm, setAuthForm] = useState({ username:"Panha", email:"panha@test2.com", password:"2345678" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: "demo",
    email: "alex@demo.com",
    username: "Alex",
    password: "1234",
    avatar: "fox",
    theme: "default",
    unlockedAvatars: ["fox"],
    unlockedThemes: ["default"],
    points: 420,
    xp: 270,
    level: 3,
    streak: 5,
  });

  // Data
  const [transactions, setTransactions] = useState([]);
  const [groups, setGroups]             = useState([]);
  const [dataLoading, setDataLoading]   = useState(false);

  // Navigation
  const [tab, setTab]             = useState("dashboard");
  const [activeGroup, setActiveGroup] = useState(null);

  // Modals
  const [showTxForm, setShowTxForm]       = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [confirm, setConfirm]             = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast]                 = useState(null);

  // Forms
  const [txForm, setTxForm] = useState({
    type:"expense", amount:"", category:"food", note:"",
    date: new Date().toISOString().split("T")[0],
  });
  const [groupName, setGroupName]       = useState("");
  const [groupExpForm, setGroupExpForm] = useState({ amount:"", note:"", paidByUserId:"" });

  // Email search
  const [memberQuery, setMemberQuery]     = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [memberSearching, setMemberSearching] = useState(false);

  // Derived
  const theme     = THEMES.find(t => t.id === currentUser?.theme) || THEMES[0];
  const avatarObj = AVATARS.find(a => a.id === currentUser?.avatar) || AVATARS[0];
  const activeGrp = groups.find(g => g.id === activeGroup);

  const showToast = (msg, type="success") => setToast({ msg, type });

  // ── XP award (persists to DB via apiUpdateUser) ───────────────────────────
  async function awardXP(amount) {
    if (!currentUser) return;
    const newXP     = currentUser.xp + amount;
    const newLevel  = Math.floor(newXP / 100) + 1;
    const newPoints = currentUser.points + Math.floor(amount / 2);
    const next = { ...currentUser, xp:newXP, level:newLevel, points:newPoints };
    setCurrentUser(next);
    await apiUpdateUser(currentUser.id, { xp:newXP, level:newLevel, points:newPoints });
  }

  async function loadData(user) {
    setDataLoading(true);
    const [txRes, grpRes] = await Promise.all([
      apiGetTransactions(user.id),
      apiGetGroups(user.id),
    ]);
    setTransactions(txRes.transactions || []);
    setGroups(grpRes.groups || []);
    setDataLoading(false);
  }

  // ── AUTH ──────────────────────────────────────────────────────────────────
  async function handleLogin() {
    setAuthLoading(true); setAuthError("");
    const res = await apiLogin(authForm.email, authForm.password);
    setAuthLoading(false);
    if (res.error) return setAuthError(res.error);
    console.log("Login res:", res);
    setCurrentUser(res.user);
    await loadData(res.user);
    setScreen("app");
  }

  async function handleRegister() {
    if (!authForm.username || !authForm.email || !authForm.password)
      return setAuthError("Please fill in all fields.");
    setAuthLoading(true); setAuthError("");
    const res: NextResponse = await apiRegister(authForm.username, authForm.email, authForm.password);
    setAuthLoading(false);
    if (res.error) return setAuthError(res.error);
    setCurrentUser(res.user); setTransactions([]); setGroups([]);
    console.log("Registered user:", res.user);
    setScreen("app");
    showToast("🎉 Account created! Here's 50 bonus points!");
  }

  function handleLogout() {
    setConfirm({
      title: "Log Out?", body: "You'll need to sign back in to access your data.",
      confirmLabel: "Log Out", color: C.pink,
      onConfirm: async () => {
        setConfirmLoading(true);
        await apiLogout();
        setConfirmLoading(false); setConfirm(null);
        setCurrentUser(null); setTransactions([]); setGroups([]);
        setTab("dashboard"); setScreen("login"); setShowSettings(false);
        setAuthForm({ username:"", email:"", password:"" });
      },
    });
  }

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────
  async function handleAddTx() {
    if (!txForm.amount || isNaN(txForm.amount)) return;
    const res = await apiAddTransaction({ userId:currentUser.id, ...txForm, amount:parseFloat(txForm.amount) });
    setTransactions(p => [res.transaction, ...p]);
    setShowTxForm(false);
    setTxForm({ type:"expense", amount:"", category:"food", note:"", date:new Date().toISOString().split("T")[0] });
    await awardXP(20);
    showToast("✅ Saved! +20 XP");
  }

  function confirmDeleteTx(id) {
    setConfirm({
      title:"Delete Transaction?", body:"This action can't be undone.",
      confirmLabel:"Delete", color:C.pink,
      onConfirm: async () => {
        setConfirmLoading(true);
        await apiDeleteTransaction(id);
        setTransactions(p => p.filter(t => t.id !== id));
        setConfirmLoading(false); setConfirm(null);
        showToast("🗑️ Deleted","warn");
      },
    });
  }

  // ── GROUPS ────────────────────────────────────────────────────────────────
  async function handleCreateGroup() {
    if (!groupName.trim()) return;
    const res = await apiCreateGroup(groupName, currentUser.id);
    setGroups(p => [...p, res.group]);
    setShowGroupForm(false); setGroupName("");
    await awardXP(30);
    showToast("👥 Group created! +30 XP");
  }

  // Debounced email search
  useEffect(() => {
    if (memberQuery.length < 2) { setMemberResults([]); return; }
    const t = setTimeout(async () => {
      setMemberSearching(true);
      const res = await apiSearchUsers(memberQuery);
      const existing = activeGrp?.members.map(m=>m.id) || [];
      setMemberResults((res.users||[]).filter(u=>!existing.includes(u.id)&&u.id!==currentUser?.id));
      setMemberSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [memberQuery]);

  async function handleAddMember(userId, username) {
    const res = await apiAddGroupMember(activeGroup, userId);
    if (res.error) return showToast(`❌ ${res.error}`,"error");
    setGroups(p => p.map(g => g.id===activeGroup ? { ...g, members:[...g.members, res.member] } : g));
    setMemberQuery(""); setMemberResults([]);
    showToast(`✅ ${username} added!`);
  }

  async function handleAddGroupExp() {
    if (!groupExpForm.amount || !groupExpForm.paidByUserId) return;
    const g = groups.find(g => g.id===activeGroup);
    const share = parseFloat(groupExpForm.amount) / g.members.length;
    const splits = {}; g.members.forEach(m => splits[m.id] = share);
    const payer = g.members.find(m => m.id===groupExpForm.paidByUserId);
    const res = await apiAddGroupExpense(activeGroup, {
      paidByUserId: groupExpForm.paidByUserId, paidByName: payer?.username||"?",
      amount: parseFloat(groupExpForm.amount), note: groupExpForm.note,
      date: new Date().toISOString().split("T")[0], splits,
    });
    setGroups(p => p.map(g => g.id===activeGroup ? { ...g, expenses:[...g.expenses, res.expense] } : g));
    setGroupExpForm({ amount:"", note:"", paidByUserId:"" });
    await awardXP(15);
    showToast("💸 Expense added! +15 XP");
  }

  // ── SHOP ─────────────────────────────────────────────────────────────────
  function handleShopBuy(itemType, item) {
    const owned  = itemType==="avatar" ? currentUser.unlockedAvatars.includes(item.id) : currentUser.unlockedThemes.includes(item.id);
    const active = itemType==="avatar" ? currentUser.avatar===item.id : currentUser.theme===item.id;
    if (active) return;
    setConfirm({
      title: owned ? `Equip ${item.label||item.emoji}?` : `Buy ${item.label||item.emoji}?`,
      body: owned
        ? `Switch your active ${itemType} to this one?`
        : `This costs ⭐ ${item.cost} points. You currently have ⭐ ${currentUser.points} points.`,
      confirmLabel: owned ? "Equip" : `Buy for ⭐ ${item.cost}`,
      color: owned ? C.blue : C.accent,
      onConfirm: async () => {
        setConfirmLoading(true);
        const res = await apiPurchaseShopItem(currentUser.id, itemType, item.id, item.cost);
        setConfirmLoading(false);
        if (res.error) { setConfirm(null); showToast(`❌ ${res.error}`,"error"); return; }
        setCurrentUser(res.user); setConfirm(null);
        showToast(owned ? `✅ ${itemType} equipped!` : `🎉 ${itemType} unlocked!`);
      },
    });
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const income   = transactions.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0);
  const expenses = transactions.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0);
  const balance  = income - expenses;
  const catTotals = CATEGORIES.map(c=>({
    ...c, value: transactions.filter(t=>t.category===c.id&&t.type==="expense").reduce((a,t)=>a+t.amount,0)
  })).filter(c=>c.value>0);
  const last7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    const key=d.toISOString().split("T")[0];
    return { l:d.toLocaleDateString("en",{weekday:"short"}).slice(0,1),
      v:transactions.filter(t=>t.date===key&&t.type==="expense").reduce((a,t)=>a+t.amount,0) };
  });

  // ── Style tokens ──────────────────────────────────────────────────────────
  const card = { background:C.card, borderRadius:20, padding:"18px 20px",
    marginBottom:14, border:"1px solid #ffffff08" };
  const sel  = { background:"#ffffff0f", border:"1.5px solid #ffffff18", borderRadius:12,
    padding:"11px 14px", color:C.white, fontSize:14, width:"100%", outline:"none",
    boxSizing:"border-box", fontFamily:"inherit" };
  const navBtn = active => ({
    flex:1, padding:"10px 4px 7px", background:"none", border:"none",
    color: active ? theme.accent : C.muted, fontSize:20, cursor:"pointer",
    borderTop: active ? `3px solid ${theme.accent}` : "3px solid transparent",
    transition:"all .2s", display:"flex", flexDirection:"column", alignItems:"center", gap:2,
  });

  // ════════════════════════════════════════════════════════════════════════════
  // AUTH SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen !== "app") {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, color:C.white, fontFamily:"'Nunito',sans-serif",
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"40px 24px", maxWidth:430, margin:"0 auto" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
          *{box-sizing:border-box;}
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          input::placeholder{color:#a7a3c244;}
          select option{background:#1a1828;}
        `}</style>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:60, marginBottom:8 }}>💰</div>
          <h1 style={{ fontSize:34, fontWeight:900, margin:"0 0 6px",
            background:`linear-gradient(90deg,${C.yellow},${C.accent})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>FinanceQuest</h1>
          <p style={{ color:C.muted, fontSize:14, margin:0 }}>Level up your money game</p>
        </div>
        <div style={{ display:"flex", background:"#ffffff0a", borderRadius:14, padding:4, marginBottom:24 }}>
          {["login","register"].map(t=>(
            <button key={t} onClick={()=>{setAuthTab(t);setAuthError("");}}
              style={{ flex:1, padding:10, border:"none", borderRadius:10, fontWeight:800, fontSize:14,
                cursor:"pointer", transition:"all .2s", fontFamily:"inherit",
                background:authTab===t?theme.accent:"none", color:authTab===t?"#fff":C.muted }}>
              {t==="login"?"Log In":"Sign Up"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {authTab==="register" && (
            <div><Lbl>USERNAME</Lbl>
              <Inp placeholder="Your name" value={authForm.username}
                onChange={e=>setAuthForm(f=>({...f,username:e.target.value}))}/></div>
          )}
          <div><Lbl>EMAIL</Lbl>
            <Inp placeholder="you@email.com" value={authForm.email}
              onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))}/></div>
          <div><Lbl>PASSWORD</Lbl>
            <Inp type="password" placeholder="••••••" value={authForm.password}
              onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))}/></div>
          {authError && <p style={{ color:C.pink, fontSize:13, margin:0, fontWeight:700 }}>{authError}</p>}
          <Btn onClick={authTab==="login"?handleLogin:handleRegister} disabled={authLoading}>
            {authLoading?"…":authTab==="login"?"🚀 Log In":"🎉 Create Account"}
          </Btn>
          {authTab==="login" && <p style={{ textAlign:"center", color:C.muted, fontSize:12, margin:0 }}>
            Demo: alex@demo.com / 1234</p>}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN APP SHELL
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:theme.bg, color:C.white,
      fontFamily:"'Nunito',sans-serif", maxWidth:430, margin:"0 auto", paddingBottom:88 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
        *{box-sizing:border-box;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder{color:#a7a3c255;}
        select option{background:#1a1828;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#ffffff20;border-radius:99px;}
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <p style={{ margin:0, color:C.muted, fontSize:11, fontWeight:700, letterSpacing:".08em" }}>WELCOME BACK</p>
          <h2 style={{ margin:"2px 0 0", fontSize:22, fontWeight:900 }}>{avatarObj.emoji} {currentUser.username}</h2>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Pill color={C.yellow}>⭐ {currentUser.points} pts</Pill>
            <button onClick={()=>setShowSettings(true)} style={{ background:"#ffffff12", border:"none",
              borderRadius:12, width:34, height:34, cursor:"pointer", fontSize:16,
              display:"flex", alignItems:"center", justifyContent:"center" }}>⚙️</button>
          </div>
          <div style={{ width:160 }}><XPBar xp={currentUser.xp} level={currentUser.level}/></div>
        </div>
      </div>
      <div style={{ padding:"8px 20px 0" }}><Pill color={C.accent}>🔥 {currentUser.streak}-day streak</Pill></div>

      {/* ── Page content ── */}
      <div style={{ padding:"16px 16px 0" }}>

        {/* ════ DASHBOARD ════ */}
        {tab==="dashboard" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            {/* Balance */}
            <div style={{ ...card, background:`linear-gradient(135deg,${theme.accent}cc,${C.purple}cc)`,
              border:"none", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-16, top:-16, fontSize:110, opacity:.06 }}>💳</div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, opacity:.75, letterSpacing:".07em" }}>BALANCE</p>
              <h1 style={{ margin:"4px 0 14px", fontSize:38, fontWeight:900 }}>{fmt(balance)}</h1>
              <div style={{ display:"flex", gap:20 }}>
                <div><p style={{ margin:0, fontSize:10, opacity:.7 }}>INCOME</p>
                  <p style={{ margin:0, fontWeight:800, color:C.green }}>{fmt(income)}</p></div>
                <div><p style={{ margin:0, fontSize:10, opacity:.7 }}>EXPENSES</p>
                  <p style={{ margin:0, fontWeight:800, color:C.pink }}>{fmt(expenses)}</p></div>
              </div>
            </div>

            {/* Weekly bars */}
            <div style={card}>
              <p style={{ margin:"0 0 12px", fontWeight:800, fontSize:14 }}>📅 Spending This Week</p>
              <MiniBar data={last7} color={theme.accent}/>
            </div>

            {/* Category donut */}
            <div style={card}>
              <p style={{ margin:"0 0 12px", fontWeight:800, fontSize:14 }}>🎯 By Category</p>
              {catTotals.length===0
                ? <p style={{ color:C.muted, fontSize:13 }}>No expenses yet — add your first!</p>
                : <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                    <Donut segments={catTotals.map(c=>({ color:c.color, value:c.value }))}/>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7 }}>
                      {catTotals.map(c=>(
                        <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:13 }}>{c.label}</span>
                          <Pill color={c.color}>{fmt(c.value)}</Pill>
                        </div>
                      ))}
                    </div>
                  </div>}
            </div>

            <Btn onClick={()=>setShowTxForm(true)}>➕ Add Transaction</Btn>

            {/* Recent */}
            <div style={{ ...card, marginTop:14 }}>
              <p style={{ margin:"0 0 12px", fontWeight:800, fontSize:14 }}>🕐 Recent</p>
              {transactions.slice(0,5).map(t=>{
                const cat=CATEGORIES.find(c=>c.id===t.category);
                return (
                  <div key={t.id} style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"9px 0", borderBottom:"1px solid #ffffff08" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:12, background:`${cat?.color}22`,
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:19 }}>
                        {cat?.label.split(" ")[0]}
                      </div>
                      <div>
                        <p style={{ margin:0, fontWeight:700, fontSize:14 }}>{t.note||cat?.label}</p>
                        <p style={{ margin:0, fontSize:11, color:C.muted }}>{t.date}</p>
                      </div>
                    </div>
                    <span style={{ fontWeight:900, color:t.type==="income"?C.green:C.pink }}>
                      {t.type==="income"?"+":"-"}{fmt(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ TRANSACTIONS ════ */}
        {tab==="transactions" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h3 style={{ margin:0, fontWeight:900 }}>All Transactions</h3>
              <button onClick={()=>setShowTxForm(true)} style={{ background:theme.accent, color:"#fff",
                border:"none", borderRadius:12, padding:"8px 16px", fontWeight:800, fontSize:13,
                cursor:"pointer", fontFamily:"inherit" }}>➕ Add</button>
            </div>
            {transactions.length===0 && <p style={{ color:C.muted }}>No transactions yet.</p>}
            {transactions.map(t=>{
              const cat=CATEGORIES.find(c=>c.id===t.category);
              return (
                <div key={t.id} style={{ ...card, display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:`${cat?.color}22`,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:21 }}>
                      {cat?.label.split(" ")[0]}
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:700 }}>{t.note||cat?.label}</p>
                      <div style={{ display:"flex", gap:6, marginTop:4 }}>
                        <Pill color={cat?.color||"#fff"}>{cat?.label.slice(2)}</Pill>
                        <span style={{ fontSize:11, color:C.muted }}>{t.date}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:900, fontSize:16, color:t.type==="income"?C.green:C.pink }}>
                      {t.type==="income"?"+":"-"}{fmt(t.amount)}
                    </span>
                    <button onClick={()=>confirmDeleteTx(t.id)} style={{ background:"#ff000020",
                      border:"none", borderRadius:8, padding:"4px 8px", color:C.pink,
                      cursor:"pointer", fontSize:13 }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ GROUPS ════ */}
        {tab==="groups" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            {activeGrp ? (
              <div>
                <button onClick={()=>{setActiveGroup(null);setMemberQuery("");setMemberResults([]);}}
                  style={{ background:"none", border:"none", color:theme.accent, fontWeight:800,
                    cursor:"pointer", fontSize:14, marginBottom:14, padding:0, fontFamily:"inherit" }}>
                  ← Back
                </button>

                {/* Balance summary */}
                <div style={card}>
                  <h3 style={{ margin:"0 0 8px", fontWeight:900 }}>{activeGrp.name}</h3>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                    {activeGrp.members.map(m=><Pill key={m.id} color={C.blue}>{m.username}</Pill>)}
                  </div>
                  {(()=>{
                    const myShare = activeGrp.expenses.reduce((a,e)=>a+(e.splits[currentUser.id]||0),0);
                    const iPaid   = activeGrp.expenses.reduce((a,e)=>a+(e.paidByUserId===currentUser.id?e.amount:0),0);
                    return (
                      <div style={{ display:"flex", gap:10 }}>
                        <div style={{ ...card, flex:1, padding:"10px 14px", marginBottom:0 }}>
                          <p style={{ margin:0, fontSize:10, color:C.muted }}>YOU OWE</p>
                          <p style={{ margin:0, fontWeight:900, color:C.pink, fontSize:18 }}>{fmt(Math.max(0,myShare-iPaid))}</p>
                        </div>
                        <div style={{ ...card, flex:1, padding:"10px 14px", marginBottom:0 }}>
                          <p style={{ margin:0, fontSize:10, color:C.muted }}>YOU'RE OWED</p>
                          <p style={{ margin:0, fontWeight:900, color:C.green, fontSize:18 }}>{fmt(Math.max(0,iPaid-myShare))}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Add member by email */}
                <div style={card}>
                  <p style={{ margin:"0 0 10px", fontWeight:800, fontSize:13 }}>➕ Add Member by Email</p>
                  <div style={{ position:"relative" }}>
                    <Inp placeholder="Search email or name…" value={memberQuery}
                      onChange={e=>setMemberQuery(e.target.value)}/>
                    {memberSearching && <span style={{ position:"absolute", right:12, top:"50%",
                      transform:"translateY(-50%)", color:C.muted, fontSize:12 }}>…</span>}
                  </div>
                  {memberResults.length>0 && (
                    <div style={{ marginTop:8, background:"#0f0e17", borderRadius:12, overflow:"hidden",
                      border:"1px solid #ffffff10" }}>
                      {memberResults.map(u=>(
                        <div key={u.id} onClick={()=>handleAddMember(u.id,u.username)}
                          style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                            borderBottom:"1px solid #ffffff08", cursor:"pointer" }}>
                          <div style={{ fontSize:22 }}>{AVATARS.find(a=>a.id===u.avatar)?.emoji||"🦊"}</div>
                          <div style={{ flex:1 }}>
                            <p style={{ margin:0, fontWeight:700, fontSize:14 }}>{u.username}</p>
                            <p style={{ margin:0, fontSize:11, color:C.muted }}>{u.email}</p>
                          </div>
                          <span style={{ fontSize:12, color:theme.accent, fontWeight:700 }}>+ Add</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {memberQuery.length>=2 && !memberSearching && memberResults.length===0 && (
                    <p style={{ color:C.muted, fontSize:12, marginTop:8 }}>No users found with that email.</p>
                  )}
                </div>

                {/* Add expense */}
                <div style={card}>
                  <p style={{ margin:"0 0 10px", fontWeight:800, fontSize:13 }}>💸 Add Shared Expense</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <Inp placeholder="Amount" type="number" value={groupExpForm.amount}
                      onChange={e=>setGroupExpForm(f=>({...f,amount:e.target.value}))}/>
                    <Inp placeholder="Note (e.g. Dinner)" value={groupExpForm.note}
                      onChange={e=>setGroupExpForm(f=>({...f,note:e.target.value}))}/>
                    <select style={sel} value={groupExpForm.paidByUserId}
                      onChange={e=>setGroupExpForm(f=>({...f,paidByUserId:e.target.value}))}>
                      <option value="">Paid by…</option>
                      {activeGrp.members.map(m=><option key={m.id} value={m.id}>{m.username}</option>)}
                    </select>
                    <Btn onClick={handleAddGroupExp}>Split Equally!</Btn>
                  </div>
                </div>

                {/* History */}
                <div style={card}>
                  <p style={{ margin:"0 0 10px", fontWeight:800, fontSize:13 }}>📋 Expense History</p>
                  {activeGrp.expenses.length===0
                    ? <p style={{ color:C.muted, fontSize:13 }}>No expenses yet.</p>
                    : activeGrp.expenses.map(e=>(
                      <div key={e.id} style={{ padding:"10px 0", borderBottom:"1px solid #ffffff08" }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontWeight:700 }}>{e.note||"Expense"}</span>
                          <span style={{ color:C.yellow, fontWeight:800 }}>{fmt(e.amount)}</span>
                        </div>
                        <p style={{ margin:"3px 0 6px", fontSize:11, color:C.muted }}>
                          Paid by {e.paidByName} · {e.date}
                        </p>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {Object.entries(e.splits).map(([uid,share])=>{
                            const m=activeGrp.members.find(m=>m.id===uid);
                            return <Pill key={uid} color={C.purple}>{m?.username||uid}: {fmt(share)}</Pill>;
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <h3 style={{ margin:0, fontWeight:900 }}>My Groups</h3>
                  <button onClick={()=>setShowGroupForm(true)} style={{ background:theme.accent, color:"#fff",
                    border:"none", borderRadius:12, padding:"8px 16px", fontWeight:800, fontSize:13,
                    cursor:"pointer", fontFamily:"inherit" }}>➕ New</button>
                </div>
                {groups.length===0 && (
                  <div style={{ ...card, textAlign:"center", padding:32 }}>
                    <div style={{ fontSize:40, marginBottom:8 }}>👥</div>
                    <p style={{ margin:0, color:C.muted }}>No groups yet. Create one to start splitting!</p>
                  </div>
                )}
                {groups.map(g=>(
                  <div key={g.id} style={{ ...card, cursor:"pointer" }} onClick={()=>setActiveGroup(g.id)}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <h4 style={{ margin:"0 0 6px", fontWeight:900 }}>{g.name}</h4>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {g.members.map(m=><Pill key={m.id} color={C.blue}>{m.username}</Pill>)}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <Pill color={C.accent}>{g.expenses.length} expenses</Pill>
                        <p style={{ margin:"4px 0 0", fontSize:11, color:C.muted }}>
                          {fmt(g.expenses.reduce((a,e)=>a+e.amount,0))} total
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ PROFILE ════ */}
        {tab==="profile" && (
          <div style={{ animation:"fadeUp .4s ease" }}>
            {/* Hero card */}
            <div style={{ ...card, textAlign:"center", position:"relative",
              background:`linear-gradient(135deg,${theme.accent}44,${C.purple}44)` }}>
              <button onClick={()=>setShowSettings(true)} style={{ position:"absolute", top:14, right:14,
                background:"#ffffff15", border:"none", borderRadius:10, padding:"6px 12px",
                cursor:"pointer", color:C.white, fontWeight:700, fontSize:12, fontFamily:"inherit" }}>
                ⚙️ Settings
              </button>
              <div style={{ fontSize:60, marginBottom:8 }}>{avatarObj.emoji}</div>
              <h2 style={{ margin:"0 0 2px", fontWeight:900 }}>{currentUser.username}</h2>
              <p style={{ margin:"0 0 12px", color:C.muted, fontSize:13 }}>{currentUser.email}</p>
              <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap", marginBottom:12 }}>
                <Pill color={C.yellow}>⭐ {currentUser.points} pts</Pill>
                <Pill color={C.accent}>🔥 {currentUser.streak} streak</Pill>
                <Pill color={C.blue}>📊 {transactions.length} tx</Pill>
              </div>
              <XPBar xp={currentUser.xp} level={currentUser.level}/>
            </div>

            {/* Avatar shop */}
            <div style={card}>
              <p style={{ margin:"0 0 12px", fontWeight:800, fontSize:14 }}>🦊 Avatar Shop</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {AVATARS.map(a=>{
                  const owned=currentUser.unlockedAvatars.includes(a.id);
                  const active=currentUser.avatar===a.id;
                  return (
                    <button key={a.id} onClick={()=>handleShopBuy("avatar",a)}
                      style={{ background:active?`${theme.accent}33`:"#ffffff0a",
                        border:active?`2px solid ${theme.accent}`:"2px solid transparent",
                        borderRadius:14, padding:12, cursor:"pointer", textAlign:"center",
                        transition:"all .2s", fontFamily:"inherit" }}>
                      <div style={{ fontSize:30 }}>{a.emoji}</div>
                      <div style={{ fontSize:11, fontWeight:700, marginTop:5,
                        color:active?theme.accent:owned?C.green:C.muted }}>
                        {active?"✓ Equipped":owned?"Equip":`⭐ ${a.cost}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme shop */}
            <div style={card}>
              <p style={{ margin:"0 0 12px", fontWeight:800, fontSize:14 }}>🎨 Theme Shop</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {THEMES.map(t=>{
                  const owned=currentUser.unlockedThemes.includes(t.id);
                  const active=currentUser.theme===t.id;
                  return (
                    <button key={t.id} onClick={()=>handleShopBuy("theme",t)}
                      style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                        background:active?`${t.accent}22`:"#ffffff08",
                        border:active?`2px solid ${t.accent}`:"2px solid transparent",
                        borderRadius:14, padding:"12px 16px", cursor:"pointer", transition:"all .2s",
                        fontFamily:"inherit" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:20, height:20, borderRadius:"50%", background:t.accent,
                          boxShadow:`0 0 8px ${t.accent}88` }}/>
                        <span style={{ color:C.white, fontWeight:800 }}>{t.label}</span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700,
                        color:active?t.accent:owned?C.green:C.muted }}>
                        {active?"✓ Active":owned?"Apply":`⭐ ${t.cost}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Achievements */}
            <div style={card}>
              <p style={{ margin:"0 0 12px", fontWeight:800, fontSize:14 }}>🏆 Achievements</p>
              {ACHIEVEMENTS.map(ach=>{
                const done=ach.check(currentUser,transactions,groups);
                return (
                  <div key={ach.id} style={{ display:"flex", alignItems:"center", gap:12,
                    padding:"9px 0", borderBottom:"1px solid #ffffff08", opacity:done?1:.35 }}>
                    <span style={{ fontSize:22 }}>{ach.icon}</span>
                    <span style={{ fontWeight:700, fontSize:14 }}>{ach.label}</span>
                    {done && <span style={{ marginLeft:"auto" }}><Pill color={C.green}>✓ Done</Pill></span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:430, background:C.card, borderTop:"1px solid #ffffff0f",
        display:"flex", zIndex:50 }}>
        {[
          { id:"dashboard",    icon:"📊", label:"Home"    },
          { id:"transactions", icon:"💳", label:"Txns"    },
          { id:"groups",       icon:"👥", label:"Groups"  },
          { id:"profile",      icon:"🎮", label:"Profile" },
        ].map(t=>(
          <button key={t.id} style={navBtn(tab===t.id)}
            onClick={()=>{ setTab(t.id); setActiveGroup(null); setMemberQuery(""); setMemberResults([]); }}>
            <span>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:700 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════ SETTINGS MODAL ════ */}
      {showSettings && (
        <BottomSheet title="⚙️ Settings" onClose={()=>setShowSettings(false)}>
          <div style={card}>
            <p style={{ margin:"0 0 6px", fontWeight:800, fontSize:13 }}>Account</p>
            <p style={{ margin:0, color:C.white, fontWeight:700 }}>{currentUser.username}</p>
            <p style={{ margin:0, color:C.muted, fontSize:13 }}>{currentUser.email}</p>
          </div>
          <div style={card}>
            <p style={{ margin:"0 0 10px", fontWeight:800, fontSize:13 }}>Stats</p>
            {[
              ["📊 Transactions", transactions.length],
              ["👥 Groups", groups.length],
              ["⭐ Points", currentUser.points],
              ["⚡ Level", currentUser.level],
              ["🔥 Streak", `${currentUser.streak} days`],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0",
                borderBottom:"1px solid #ffffff08", fontSize:14 }}>
                <span style={{ color:C.muted }}>{k}</span>
                <span style={{ fontWeight:800 }}>{v}</span>
              </div>
            ))}
          </div>
          <Btn onClick={handleLogout} color={C.pink}>🚪 Log Out</Btn>
          <div style={{ height:12 }}/>
        </BottomSheet>
      )}

      {/* ════ ADD TRANSACTION ════ */}
      {showTxForm && (
        <BottomSheet title="➕ Add Transaction" onClose={()=>setShowTxForm(false)}>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {["expense","income"].map(type=>(
              <button key={type} onClick={()=>setTxForm(f=>({...f,type}))}
                style={{ flex:1, padding:10, border:"none", borderRadius:12, fontWeight:800,
                  cursor:"pointer", fontSize:14, fontFamily:"inherit", transition:"all .2s",
                  background:txForm.type===type?(type==="income"?C.green:C.pink):"#ffffff15",
                  color:txForm.type===type?"#fff":C.muted }}>
                {type==="income"?"💚 Income":"❤️ Expense"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div><Lbl>AMOUNT</Lbl><Inp placeholder="0" type="number" value={txForm.amount}
              onChange={e=>setTxForm(f=>({...f,amount:e.target.value}))}/></div>
            <div><Lbl>CATEGORY</Lbl>
              <select style={sel} value={txForm.category}
                onChange={e=>setTxForm(f=>({...f,category:e.target.value}))}>
                {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select></div>
            <div><Lbl>NOTE (optional)</Lbl><Inp placeholder="What was it?" value={txForm.note}
              onChange={e=>setTxForm(f=>({...f,note:e.target.value}))}/></div>
            <div><Lbl>DATE</Lbl><Inp type="date" value={txForm.date}
              onChange={e=>setTxForm(f=>({...f,date:e.target.value}))}/></div>
            <Btn onClick={handleAddTx}>Save Transaction</Btn>
            <Btn onClick={()=>setShowTxForm(false)} color="#ffffff15" textColor={C.muted}>Cancel</Btn>
          </div>
          <div style={{ height:8 }}/>
        </BottomSheet>
      )}

      {/* ════ CREATE GROUP ════ */}
      {showGroupForm && (
        <BottomSheet title="👥 New Group" onClose={()=>setShowGroupForm(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div><Lbl>GROUP NAME</Lbl><Inp placeholder="e.g. 🏠 Apartment" value={groupName}
              onChange={e=>setGroupName(e.target.value)}/></div>
            <Btn onClick={handleCreateGroup}>Create Group</Btn>
            <Btn onClick={()=>setShowGroupForm(false)} color="#ffffff15" textColor={C.muted}>Cancel</Btn>
          </div>
          <div style={{ height:8 }}/>
        </BottomSheet>
      )}

      {/* ════ CONFIRM DIALOG ════ */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title} body={confirm.body}
          confirmLabel={confirm.confirmLabel} confirmColor={confirm.color}
          loading={confirmLoading} onConfirm={confirm.onConfirm}
          onCancel={()=>!confirmLoading&&setConfirm(null)}/>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}
