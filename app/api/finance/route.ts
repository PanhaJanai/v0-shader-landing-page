// ═══════════════════════════════════════════════════════════════════════════════
// financequest-api.js  —  MOCK API LAYER
//
// Every function here mirrors a real Next.js API route (shown in the comment
// above each function). To go live, replace the function BODY with a fetch()
// to that route. The shape of the return value must stay the same.
//
// Suggested Next.js folder layout:
//   /app/api/auth/login/route.ts
//   /app/api/auth/register/route.ts
//   /app/api/auth/logout/route.ts
//   /app/api/users/search/route.ts          (?email=)
//   /app/api/transactions/route.ts          (GET / POST)
//   /app/api/transactions/[id]/route.ts     (DELETE)
//   /app/api/groups/route.ts                (GET / POST)
//   /app/api/groups/[id]/members/route.ts   (POST)
//   /app/api/groups/[id]/expenses/route.ts  (POST)
//   /app/api/users/[id]/route.ts            (PATCH)
//   /app/api/shop/purchase/route.ts         (POST)
//
// Auth strategy: Use NextAuth.js (or your own JWT middleware).
// Session is passed as a Bearer token in the Authorization header, e.g.:
//   headers: { Authorization: `Bearer ${session.token}` }
//
// Database: Prisma + PostgreSQL recommended. Supabase also works great.
// ═══════════════════════════════════════════════════════════════════════════════

// ── In-memory mock store (delete everything below when going to Next.js) ───────
"use server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Import the singleton we created

let _users = [
  {
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
  },
  {
    id: "demo2",
    username: "Jamie",
    email: "jamie@demo.com",
    password: "1234",
    avatar: "cat",
    theme: "ocean",
    unlockedAvatars: ["fox", "cat"],
    unlockedThemes: ["default", "ocean"],
    points: 310,
    xp: 150,
    level: 2,
    streak: 2,
  },
];

let _transactions = [
  { id: "t1", userId: "demo", type: "expense", amount: 45,   category: "food",      note: "Groceries",    date: "2024-06-10" },
  { id: "t2", userId: "demo", type: "expense", amount: 120,  category: "transport", note: "Monthly pass", date: "2024-06-09" },
  { id: "t3", userId: "demo", type: "income",  amount: 3200, category: "other",     note: "Salary",       date: "2024-06-01" },
  { id: "t4", userId: "demo", type: "expense", amount: 60,   category: "fun",       note: "Games",        date: "2024-06-07" },
  { id: "t5", userId: "demo", type: "expense", amount: 800,  category: "rent",      note: "June rent",    date: "2024-06-01" },
];

let _groups = [
  {
    id: "g1",
    name: "🏠 Apartment",
    creatorId: "demo",
    memberIds: ["demo", "demo2"],
    expenses: [
      {
        id: "e1",
        paidByUserId: "demo",
        paidByName: "Alex",
        amount: 150,
        note: "Groceries",
        date: "2024-06-08",
        splits: { demo: 75, demo2: 75 },
      },
    ],
  },
];

function uid() { return Math.random().toString(36).slice(2, 9); }
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
// ── End of mock store ──────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body:  { email, password }
// Returns: { user } | { error }
// Next.js: validate creds, create session (NextAuth / JWT), return sanitised user
// ─────────────────────────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  // await delay();
  // const user = _users.find((u) => u.email === email && u.password === password);
  // if (!user) return { error: "Wrong email or password." };
  // const { password: _, ...safe } = user;
  // return { user: safe };ion

  try {
    const isUserExists = await prisma.financeUser.findUnique({
      where: {
        email: email,
      },
    });
    console.log(isUserExists);
    if (!isUserExists) {
      return ({ error: "Wrong email or password." });
    }
    return ({ user: isUserExists });
  } catch (error) {
    return ({ error: "Failed to login", details: String(error) });
  }
} 


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body:  { username, email, password }
// Returns: { user } | { error }
// Next.js: hash password (bcrypt), insert user, start session
// ─────────────────────────────────────────────────────────────────────────────
export async function apiRegister(username, email, password) {
  // await delay();
  // if (_users.find((u) => u.email === email)) return { error: "Email already in use." };

  // const newUser = {
  //   id: uid(), username, email, password,
  //   avatar: "fox", theme: "default",
  //   unlockedAvatars: ["fox"], unlockedThemes: ["default"],
  //   points: 50, xp: 0, level: 1, streak: 0,
  // };
  // _users.push(newUser);
  // const { password: _, ...safe } = newUser;
  // return { user: safe };

  try {
    console.log("Attempting to register user with email:", email);
    const isUserAvailable = await prisma.financeUser.findUnique({
      where: {
        email: email,
      },
    })
    if (isUserAvailable) {
      return ({ error: "Email already in use." });
    }
      const safeUser = await prisma.financeUser.create({
        data: {
          email: email,
          username: username,
          password: password, // Still passed here to be saved
          unlockedThemes: ["default"],
          unlockedAvatars: ["cat"],
        },
        select: {
          email: true,
          username: true,
          unlockedThemes: true,
          unlockedAvatars: true,
          points: true,
          xp: true,
          level: true,
          streak: true,
          // Note: password is NOT here, so it won't be returned
        }
      });
      console.log("New user created:", safeUser);
      return ({user: safeUser,  status: 201 });
  } catch (error) {
    return ({ error: "Failed to register", details: String(error) }); // ✅ Plain object
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Returns: { ok: true }
// Next.js: clear session cookie / invalidate JWT
// ─────────────────────────────────────────────────────────────────────────────
export async function apiLogout() {
  await delay(60);
  return { ok: true };
}


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/search?email=<query>
// Returns: { users: [ { id, username, email, avatar } ] }
// Next.js: SELECT id, username, email, avatar FROM users WHERE email ILIKE '%?%' LIMIT 5
// ─────────────────────────────────────────────────────────────────────────────
export async function apiSearchUsers(query) {
  await delay();
  const q = query.toLowerCase();
  const results = _users
    .filter((u) => u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    .map(({ id, username, email, avatar }) => ({ id, username, email, avatar }));
  return { users: results };
}


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transactions?userId=<id>
// Returns: { transactions: [...] }
// Next.js: SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetTransactions(userId) {
  await delay();
  return { transactions: _transactions.filter((t) => t.userId === userId) };
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transactions
// Body:  { userId, type, amount, category, note, date }
// Returns: { transaction }
// ─────────────────────────────────────────────────────────────────────────────
export async function apiAddTransaction(tx) {
  await delay();
  const newTx = { id: uid(), ...tx };
  _transactions.unshift(newTx);
  return { transaction: newTx };
}


// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/transactions/:id
// Returns: { ok: true }
// ─────────────────────────────────────────────────────────────────────────────
export async function apiDeleteTransaction(id) {
  await delay();
  _transactions = _transactions.filter((t) => t.id !== id);
  return { ok: true };
}


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/groups?userId=<id>
// Returns: { groups: [...] }  — includes member user objects + expenses
// Next.js: JOIN group_members → users, LEFT JOIN expenses
// ─────────────────────────────────────────────────────────────────────────────
export async function apiGetGroups(userId) {
  await delay();
  const myGroups = _groups.filter((g) => g.memberIds.includes(userId));
  const hydrated = myGroups.map((g) => ({
    ...g,
    members: g.memberIds.map((mid) => {
      const u = _users.find((u) => u.id === mid);
      return u ? { id: u.id, username: u.username, email: u.email, avatar: u.avatar } : null;
    }).filter(Boolean),
  }));
  return { groups: hydrated };
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/groups
// Body:  { name, creatorId }
// Returns: { group }
// ─────────────────────────────────────────────────────────────────────────────
export async function apiCreateGroup(name, creatorId) {
  await delay();
  const newGroup = { id: uid(), name, creatorId, memberIds: [creatorId], expenses: [] };
  _groups.push(newGroup);
  const creator = _users.find((u) => u.id === creatorId);
  return {
    group: {
      ...newGroup,
      members: creator ? [{ id: creator.id, username: creator.username, email: creator.email, avatar: creator.avatar }] : [],
    },
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/groups/:id/members
// Body:  { userId }   ← resolved from email search on client
// Returns: { group } (updated)
// Next.js: INSERT INTO group_members (group_id, user_id)
// ─────────────────────────────────────────────────────────────────────────────
export async function apiAddGroupMember(groupId, userId) {
  await delay();
  const g = _groups.find((g) => g.id === groupId);
  if (!g) return { error: "Group not found." };
  if (g.memberIds.includes(userId)) return { error: "Already a member." };
  g.memberIds.push(userId);
  const user = _users.find((u) => u.id === userId);
  return { member: user ? { id: user.id, username: user.username, email: user.email, avatar: user.avatar } : null };
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/groups/:id/expenses
// Body:  { paidByUserId, amount, note, date, splits: { userId: amount } }
// Returns: { expense }
// ─────────────────────────────────────────────────────────────────────────────
export async function apiAddGroupExpense(groupId, expense) {
  await delay();
  const g = _groups.find((g) => g.id === groupId);
  if (!g) return { error: "Group not found." };
  const newExp = { id: uid(), ...expense };
  g.expenses.push(newExp);
  return { expense: newExp };
}


// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/users/:id
// Body:  Partial<User>  (e.g. { xp, level, points, streak })
// Returns: { user }
// Next.js: UPDATE users SET ... WHERE id = ?
// ─────────────────────────────────────────────────────────────────────────────
export async function apiUpdateUser(userId, data) {
  await delay(80);
  const idx = _users.findIndex((u) => u.id === userId);
  if (idx === -1) return { error: "User not found." };
  _users[idx] = { ..._users[idx], ...data };
  const { password: _, ...safe } = _users[idx];
  return { user: safe };
}


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/shop/purchase
// Body:  { userId, itemType: "avatar"|"theme", itemId, cost }
// Returns: { user } (updated) | { error }
// Next.js: check points, deduct, insert into user_unlocks, UPDATE users
// ─────────────────────────────────────────────────────────────────────────────
export async function apiPurchaseShopItem(userId, itemType, itemId, cost) {
  await delay();
  const user = _users.find((u) => u.id === userId);
  if (!user) return { error: "User not found." };

  const alreadyOwned =
    itemType === "avatar"
      ? user.unlockedAvatars.includes(itemId)
      : user.unlockedThemes.includes(itemId);

  if (!alreadyOwned) {
    if (user.points < cost) return { error: "Not enough points." };
    user.points -= cost;
    if (itemType === "avatar") user.unlockedAvatars.push(itemId);
    else user.unlockedThemes.push(itemId);
  }

  // Equip regardless
  if (itemType === "avatar") user.avatar = itemId;
  else user.theme = itemId;

  const { password: _, ...safe } = user;
  return { user: safe };
}
