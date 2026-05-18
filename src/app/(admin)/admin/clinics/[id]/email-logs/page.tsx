import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { messages } from "@/lib/messages"
import { EmailLogsView } from "@/components/admin/email-logs-view"

export default async function ClinicEmailLogsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!clinic) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label={messages.emailLogs.backToAdmin}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{messages.emailLogs.title}</h1>
          <p className="text-sm text-muted-foreground">{clinic.name}</p>
        </div>
      </div>

      <EmailLogsView clinicId={clinic.id} />
    </div>
  )
}
