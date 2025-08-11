// /lib/client-id.ts
function readCookie(name: string) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return m ? decodeURIComponent(m[1]) : null
}

function writeCookie(name: string, value: string, days = 365) {
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`
}

export function getOrCreateClientId(): string {
  if (typeof window === "undefined") return "srv-" // não usado no server
  let id = localStorage.getItem("client_id") || readCookie("client_id")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("client_id", id)
    writeCookie("client_id", id)
  } else {
    // mantém os dois em sincronia
    if (!localStorage.getItem("client_id")) localStorage.setItem("client_id", id)
    if (!readCookie("client_id")) writeCookie("client_id", id)
  }
  return id
}
