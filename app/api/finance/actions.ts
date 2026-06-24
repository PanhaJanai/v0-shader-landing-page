"use server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { 
  FinanceUser as PrismaFinanceUser, 
  Transaction as PrismaTransaction, 
  Group as PrismaGroup, 
  GroupExpense as PrismaGroupExpense, 
  SavingsGoal as PrismaSavingsGoal 
} from "@prisma/client";

export interface FinanceUserSafe {
  id: string;
  email: string;
  username: string;
  avatar: string;
  theme: string;
  unlockedAvatars: string[];
  unlockedThemes: string[];
  budgetLimits: Record<string, number>;
  points: number;
  xp: number;
  level: number;
  streak: number;
  createdAt: Date;
}

// PBKDF2 Password Hashing (Secure, zero-dependency)
function hashPassword(password: string): string {
  const salt = "financeQuest_secure_salt_super_key_99!";
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Helper to safely parse user unlocks from the database
const parseUser = (u: any): FinanceUserSafe => {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    avatar: u.avatar,
    theme: u.theme,
    points: u.points,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    unlockedAvatars: (u.unlockedAvatars || []).map((a: any) => a.avatarId),
    unlockedThemes: (u.unlockedThemes || []).map((t: any) => t.themeId),
    budgetLimits: (u.budgetLimits || []).reduce((acc: Record<string, number>, b: any) => {
      acc[b.category] = b.amount;
      return acc;
    }, {}),
    createdAt: u.createdAt,
  };
};

export async function apiGetSessionUser(): Promise<{ user?: FinanceUserSafe; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("financeQuest_session")?.value;
    if (!token) return { error: "No active session." };

    const user = await prisma.financeUser.findUnique({
      where: { sessionToken: token },
      include: {
        unlockedAvatars: true,
        unlockedThemes: true,
        budgetLimits: true,
      }
    });

    if (!user) return { error: "Session invalid or expired." };
    return { user: parseUser(user) };
  } catch (error) {
    return { error: "Failed to load session user" };
  }
}

export async function apiLogin(email: string, password: string): Promise<{ user?: FinanceUserSafe; error?: string }> {
  try {
    const user = await prisma.financeUser.findUnique({
      where: { email },
      include: {
        unlockedAvatars: true,
        unlockedThemes: true,
        budgetLimits: true,
      }
    });

    if (!user || user.passwordHash !== hashPassword(password)) {
      return { error: "Wrong email or password." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.financeUser.update({
      where: { id: user.id },
      data: { sessionToken: token }
    });

    const cookieStore = await cookies();
    cookieStore.set("financeQuest_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    user.sessionToken = token;
    return { user: parseUser(user) };
  } catch (error) {
    return { error: "Failed to login" };
  }
}

export async function apiRegister(username: string, email: string, password: string): Promise<{ user?: FinanceUserSafe; error?: string }> {
  try {
    const exists = await prisma.financeUser.findUnique({ where: { email } });
    if (exists) return { error: "Email already in use." };

    const token = crypto.randomBytes(32).toString("hex");
    const newUser = await prisma.financeUser.create({
      data: {
        email,
        username,
        passwordHash: hashPassword(password),
        sessionToken: token,
        unlockedThemes: { create: { themeId: "default" } },
        unlockedAvatars: { create: { avatarId: "fox" } },
      },
      include: {
        unlockedAvatars: true,
        unlockedThemes: true,
        budgetLimits: true,
      }
    });

    const cookieStore = await cookies();
    cookieStore.set("financeQuest_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    return { user: parseUser(newUser) };
  } catch (error) {
    return { error: "Failed to register" };
  }
}

export async function apiLogout(): Promise<{ ok: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("financeQuest_session")?.value;
    if (token) {
      await prisma.financeUser.updateMany({
        where: { sessionToken: token },
        data: { sessionToken: null }
      });
    }
    cookieStore.delete("financeQuest_session");
  } catch (e) {}
  return { ok: true };
}

export async function apiSearchUsers(query: string): Promise<{ users: { id: string; username: string; email: string; avatar: string }[] }> {
  const q = query.toLowerCase();
  const users = await prisma.financeUser.findMany({
    where: {
      OR: [
        { email: { contains: q } },
        { username: { contains: q } }
      ]
    },
    take: 5,
    select: { id: true, username: true, email: true, avatar: true }
  });
  return { users };
}

export async function apiGetTransactions(userId: string): Promise<{ transactions: PrismaTransaction[] }> {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });
  return { transactions };
}

export async function apiAddTransaction(
  user: { id: string }, 
  tx: { amount: number; type: string; category: string; note?: string; date: string }
): Promise<{ transaction?: PrismaTransaction; error?: string }> {
  try {
    const newTransaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: tx.amount,
        type: tx.type,
        note: tx.note || null,
        date: tx.date,
        category: tx.category,
      }
    });
    return { transaction: newTransaction };
  } catch (error) {
    return { error: "Failed to add transaction" };
  }
}

export async function apiDeleteTransaction(id: string): Promise<{ ok: boolean }> {
  await prisma.transaction.delete({ where: { id } });
  return { ok: true };
}

export async function apiGetGroups(userId: string): Promise<{ groups: any[] }> {
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, username: true, email: true, avatar: true } } } },
      expenses: true,
    }
  });

  const hydrated = groups.map(g => ({
    id: g.id,
    name: g.name,
    creatorId: g.creatorId,
    members: g.members.map(m => m.user),
    expenses: g.expenses.map(e => ({ ...e, splits: JSON.parse(e.splits) }))
  }));

  return { groups: hydrated };
}

export async function apiCreateGroup(name: string, creatorId: string): Promise<{ group: any }> {
  const group = await prisma.group.create({
    data: {
      name,
      creatorId,
      members: { create: { userId: creatorId } }
    },
    include: { 
      members: { include: { user: { select: { id: true, username: true, email: true, avatar: true } } } }, 
      expenses: true 
    }
  });

  const formatted = {
    id: group.id,
    name: group.name,
    creatorId: group.creatorId,
    members: group.members.map(m => m.user),
    expenses: []
  };
  return { group: formatted };
}

export async function apiAddGroupMember(groupId: string, userId: string): Promise<{ member?: any; error?: string }> {
  try {
    const member = await prisma.groupMember.create({
      data: { groupId, userId },
      include: { user: { select: { id: true, username: true, email: true, avatar: true } } }
    });
    return { member: member.user };
  } catch (error) {
    return { error: "Already a member or failed to add." };
  }
}

export async function apiAddGroupExpense(
  groupId: string, 
  expense: { paidByUserId: string; paidByName: string; amount: number; note?: string; date: string; splits: Record<string, number> }
): Promise<{ expense: any }> {
  const newExp = await prisma.groupExpense.create({
    data: {
      groupId,
      paidByUserId: expense.paidByUserId,
      paidByName: expense.paidByName,
      amount: expense.amount,
      note: expense.note || null,
      date: expense.date,
      splits: JSON.stringify(expense.splits),
    }
  });
  return { expense: { ...newExp, splits: JSON.parse(newExp.splits) } };
}

export async function apiUpdateUser(userId: string, data: Partial<PrismaFinanceUser>): Promise<{ user?: FinanceUserSafe; error?: string }> {
  try {
    const updated = await prisma.financeUser.update({
      where: { id: userId },
      data,
      include: {
        unlockedAvatars: true,
        unlockedThemes: true,
        budgetLimits: true,
      }
    });
    return { user: parseUser(updated) };
  } catch (error) {
    return { error: "Failed to update user stats" };
  }
}

export async function apiPurchaseShopItem(
  userId: string, 
  itemType: "avatar" | "theme", 
  itemId: string, 
  cost: number
): Promise<{ user?: FinanceUserSafe; error?: string }> {
  const user = await prisma.financeUser.findUnique({ 
    where: { id: userId },
    include: {
      unlockedAvatars: true,
      unlockedThemes: true,
      budgetLimits: true,
    }
  });
  if (!user) return { error: "User not found." };

  const parsed = parseUser(user);
  const alreadyOwned = itemType === "avatar" 
    ? parsed.unlockedAvatars.includes(itemId) 
    : parsed.unlockedThemes.includes(itemId);

  const updates: Partial<PrismaFinanceUser> = {};

  if (!alreadyOwned) {
    if (user.points < cost) return { error: "Not enough points." };
    updates.points = user.points - cost;
    
    if (itemType === "avatar") {
      await prisma.userAvatar.create({
        data: { userId, avatarId: itemId }
      });
    } else {
      await prisma.userTheme.create({
        data: { userId, themeId: itemId }
      });
    }
  }

  // Equip
  if (itemType === "avatar") updates.avatar = itemId;
  else updates.theme = itemId;

  const finalUser = await prisma.financeUser.update({
    where: { id: userId },
    data: updates,
    include: {
      unlockedAvatars: true,
      unlockedThemes: true,
      budgetLimits: true,
    }
  });

  return { user: parseUser(finalUser) };
}

export async function apiGetSavingsGoals(userId: string): Promise<{ goals: PrismaSavingsGoal[] }> {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  return { goals };
}

export async function apiCreateSavingsGoal(userId: string, name: string, targetAmount: string | number): Promise<{ goal?: PrismaSavingsGoal; error?: string }> {
  try {
    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetAmount: typeof targetAmount === "string" ? parseFloat(targetAmount) : targetAmount,
        savedAmount: 0
      }
    });
    return { goal };
  } catch (error) {
    return { error: "Failed to create savings goal" };
  }
}

export async function apiContributeToSavingsGoal(
  userId: string, 
  goalId: string, 
  amount: string | number
): Promise<{ goal?: PrismaSavingsGoal; transaction?: PrismaTransaction; error?: string }> {
  try {
    const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } });
    if (!goal) return { error: "Goal not found" };

    const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    const updatedGoal = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: { savedAmount: goal.savedAmount + parsedAmount }
    });

    const tx = await prisma.transaction.create({
      data: {
        userId,
        amount: parsedAmount,
        type: "expense",
        category: "savings",
        note: `Saved for: ${goal.name}`,
        date: new Date().toISOString().split("T")[0]
      }
    });

    return { goal: updatedGoal, transaction: tx };
  } catch (error) {
    return { error: "Failed to contribute to savings goal" };
  }
}

export async function apiDeleteSavingsGoal(id: string): Promise<{ ok?: boolean; error?: string }> {
  try {
    await prisma.savingsGoal.delete({ where: { id } });
    return { ok: true };
  } catch (error) {
    return { error: "Failed to delete savings goal" };
  }
}

export async function apiUpdateBudgetLimits(userId: string, limits: Record<string, number>): Promise<{ user?: FinanceUserSafe; error?: string }> {
  try {
    // Delete existing budget limits
    await prisma.budgetLimit.deleteMany({ where: { userId } });

    // Create new budget limits
    const createData = Object.entries(limits).map(([category, amount]) => ({
      userId,
      category,
      amount
    }));

    await prisma.budgetLimit.createMany({
      data: createData
    });

    const updated = await prisma.financeUser.findUnique({
      where: { id: userId },
      include: {
        unlockedAvatars: true,
        unlockedThemes: true,
        budgetLimits: true,
      }
    });

    if (!updated) return { error: "User not found" };
    return { user: parseUser(updated) };
  } catch (error) {
    return { error: "Failed to update budget limits" };
  }
}
