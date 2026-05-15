import Link from "next/link"
import { CheckCircle2, Clock3, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const statusConfig = {
  sucesso: {
    title: "Pagamento aprovado",
    description:
      "Seu pagamento foi confirmado. Agora é só acompanhar os próximos passos do pedido.",
    icon: CheckCircle2,
    accent: "text-primary",
  },
  pendente: {
    title: "Pagamento pendente",
    description:
      "O Mercado Pago ainda está processando a confirmação. Você pode acompanhar o status e tentar novamente se necessário.",
    icon: Clock3,
    accent: "text-accent",
  },
  falha: {
    title: "Pagamento não concluído",
    description:
      "O pagamento não foi finalizado. Você pode voltar para a loja e tentar novamente.",
    icon: XCircle,
    accent: "text-destructive",
  },
} as const

type PaymentStatus = keyof typeof statusConfig

export default async function PaymentStatusPage({
  params,
}: {
  params: Promise<{ status: string }>
}) {
  const { status } = await params

  const config = statusConfig[status as PaymentStatus] ?? statusConfig.falha
  const StatusIcon = config.icon

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <StatusIcon className={`h-8 w-8 ${config.accent}`} />
        </div>

        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Mercado Pago
        </p>
        <h1 className="text-3xl font-black text-foreground">{config.title}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {config.description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Voltar para a loja</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/#produtos">Continuar comprando</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
