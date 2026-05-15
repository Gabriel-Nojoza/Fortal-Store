"use client"

import { useEffect, useMemo, useState } from "react"
import { BellOff, BellRing, ShieldAlert, Smartphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

type PushState =
  | "checking"
  | "unsupported"
  | "insecure"
  | "unconfigured"
  | "permission-default"
  | "permission-denied"
  | "ready"
  | "subscribed"

function getDefaultDeviceName() {
  if (typeof navigator === "undefined") {
    return "Meu celular"
  }

  const platform = navigator.userAgent.includes("iPhone")
    ? "iPhone"
    : navigator.userAgent.includes("Android")
      ? "Android"
      : "Aparelho"

  return `Admin ${platform}`
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index)
  }

  return output
}

export function PushNotificationSettings() {
  const [pushState, setPushState] = useState<PushState>("checking")
  const [isBusy, setIsBusy] = useState(false)
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [publicKey, setPublicKey] = useState("")

  useEffect(() => {
    async function loadPushState() {
      if (typeof window === "undefined") {
        return
      }

      if (!window.isSecureContext) {
        setPushState("insecure")
        return
      }

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setPushState("unsupported")
        return
      }

      try {
        const configResponse = await fetch("/api/push/public-key", {
          cache: "no-store",
        })
        const configPayload = await configResponse.json()

        if (!configPayload?.configured || !configPayload?.publicKey) {
          setPushState("unconfigured")
          return
        }

        setPublicKey(configPayload.publicKey)

        const nextRegistration = await navigator.serviceWorker.register(
          "/admin-sw.js"
        )
        setRegistration(nextRegistration)

        const currentSubscription =
          await nextRegistration.pushManager.getSubscription()

        setSubscription(currentSubscription)

        if (currentSubscription) {
          setPushState("subscribed")
          return
        }

        if (Notification.permission === "denied") {
          setPushState("permission-denied")
          return
        }

        if (Notification.permission === "granted") {
          setPushState("ready")
          return
        }

        setPushState("permission-default")
      } catch (error) {
        console.error("Erro ao preparar push:", error)
        setPushState("unsupported")
      }
    }

    void loadPushState()
  }, [])

  const description = useMemo(() => {
    switch (pushState) {
      case "insecure":
        return "Push real precisa de HTTPS. No celular isso vai funcionar quando o site estiver hospedado na Vercel."
      case "unsupported":
        return "Esse aparelho ou navegador nao suporta notificacoes push em segundo plano."
      case "unconfigured":
        return "Falta configurar as chaves Web Push no servidor."
      case "permission-denied":
        return "As notificacoes foram bloqueadas nesse aparelho. Libere no navegador e recarregue o admin."
      case "subscribed":
        return "Esse aparelho ja esta cadastrado para receber push com o admin fechado."
      case "ready":
        return "Esse aparelho ja liberou notificacao. Falta cadastrar o push para receber o aviso mesmo com a tela apagada."
      default:
        return "No iPhone, instale o admin na tela inicial antes de ativar. No Android, a notificacao push funciona no navegador com HTTPS."
    }
  }, [pushState])

  async function handleSubscribe() {
    if (!registration || !publicKey) {
      toast({
        title: "Push indisponivel",
        description:
          "Nao foi possivel preparar o service worker ou a chave de push.",
      })
      return
    }

    try {
      setIsBusy(true)

      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        setPushState(
          permission === "denied" ? "permission-denied" : "permission-default"
        )
        toast({
          title: "Permissao nao concedida",
          description:
            "Sem a permissao do navegador, esse aparelho nao vai receber push em segundo plano.",
        })
        return
      }

      const nextSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: nextSubscription.toJSON(),
          deviceName: getDefaultDeviceName(),
          userAgent: navigator.userAgent,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error || "Falha ao salvar a assinatura push.")
        }
      })

      setSubscription(nextSubscription)
      setPushState("subscribed")
      toast({
        title: "Push ativado",
        description:
          "Esse aparelho agora pode receber pedido novo mesmo com o admin fechado.",
      })
    } catch (error) {
      console.error("Erro ao ativar push:", error)
      toast({
        title: "Erro ao ativar push",
        description:
          error instanceof Error
            ? error.message
            : "Nao foi possivel ativar as notificacoes push.",
      })
    } finally {
      setIsBusy(false)
    }
  }

  async function handleUnsubscribe() {
    if (!subscription) {
      return
    }

    try {
      setIsBusy(true)

      await fetch("/api/push/subscriptions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      })

      await subscription.unsubscribe()
      setSubscription(null)
      setPushState("ready")
      toast({
        title: "Push desativado",
        description:
          "Esse aparelho deixou de receber notificacoes em segundo plano.",
      })
    } catch (error) {
      console.error("Erro ao desativar push:", error)
      toast({
        title: "Erro ao desativar push",
        description:
          "Nao foi possivel remover essa assinatura de notificacao agora.",
      })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Notificacao com admin fechado
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Ative o push em cada celular do admin para receber pedido novo mesmo
          com a tela apagada.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 md:items-end">
        {pushState === "subscribed" ? (
          <>
            <Badge className="gap-2 bg-primary text-primary-foreground">
              <BellRing className="h-3.5 w-3.5" />
              Push ativo neste aparelho
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleUnsubscribe()}
              disabled={isBusy}
              className="gap-2"
            >
              <BellOff className="h-4 w-4" />
              Desativar push
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSubscribe()}
            disabled={
              isBusy ||
              pushState === "unsupported" ||
              pushState === "insecure" ||
              pushState === "unconfigured"
            }
            className="gap-2"
          >
            {pushState === "permission-denied" ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
            Ativar push neste aparelho
          </Button>
        )}
      </div>
    </div>
  )
}
