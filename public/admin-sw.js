self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {}
  const title = payload.title || "Novo pedido na Fortal Store"

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "Tem um pedido novo aguardando atendimento.",
      icon: "/apple-icon.png",
      badge: "/icon-light-32x32.png",
      tag: payload.tag || "fortal-order",
      renotify: true,
      data: {
        url: payload.url || "/admin",
      },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      const targetUrl = event.notification.data?.url || "/admin"

      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})
