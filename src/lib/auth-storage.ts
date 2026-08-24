const TOKEN_KEY = 'access_token';

/**
 * persist=true → localStorage (يضل بعد إغلاق المتصفح، لخيار "تذكرني")
 * persist=false → sessionStorage (يختفي بإغلاق التاب، الافتراضي الأكثر أماناً)
 */
export function setToken(token: string, persist: boolean = false): void {
  if (typeof window === 'undefined') return;

  if (persist) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY); // تفادي نسخة قديمة بمكان تاني
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // ما منعرف مسبقاً وين اتخزن، فبنشيك على الاثنين
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
