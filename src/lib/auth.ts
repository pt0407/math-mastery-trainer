export interface UserAccount {
  username: string;
  passwordHash: string;
}

const ACCOUNTS_KEY = 'mathsprint_accounts';
const SESSION_KEY = 'mathsprint_session';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function loadAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveAccounts(accounts: UserAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function register(username: string, password: string): { success: boolean; error?: string } {
  if (username.length < 2) return { success: false, error: 'Username must be at least 2 characters' };
  if (password.length < 4) return { success: false, error: 'Password must be at least 4 characters' };

  const accounts = loadAccounts();
  if (accounts.find(a => a.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'Username already taken' };
  }

  accounts.push({ username, passwordHash: simpleHash(password) });
  saveAccounts(accounts);
  localStorage.setItem(SESSION_KEY, username);
  return { success: true };
}

export function login(username: string, password: string): { success: boolean; error?: string } {
  const accounts = loadAccounts();
  const account = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
  if (!account) return { success: false, error: 'Account not found' };
  if (account.passwordHash !== simpleHash(password)) return { success: false, error: 'Wrong password' };

  localStorage.setItem(SESSION_KEY, account.username);
  return { success: true };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}
