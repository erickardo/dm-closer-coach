import Link from 'next/link'
import { MessageSquare, Megaphone, TrendingUp, ArrowRight, Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const tools = [
    {
      title: "Coach de DMs",
      description: "Analiza capturas de pantalla de tus chats, descubre errores y obtén respuestas maestras para cerrar más ventas en Instagram.",
      icon: MessageSquare,
      href: "/dashboard/dm-analyzer",
      color: "text-blue-500"
    },
    {
      title: "Diagnóstico de Bandeja",
      description: "Sube el export de tus DMs de Instagram y recibe un diagnóstico de ventas de toda tu bandeja: tasas, objeciones reales, errores y plan de acción en PDF.",
      icon: Inbox,
      href: "/dashboard/dm-inbox",
      color: "text-[#8c6b52]"
    },
    {
      title: "Estratega de Anuncios",
      description: "Genera copy publicitario de alta conversión usando la Ecuación de Valor. Sin rodeos, 100% efectividad.",
      icon: Megaphone,
      href: "/dashboard/ad-strategist",
      color: "text-[#b4bfa5]"
    },
    {
      title: "Validador de Negocios Pro",
      description: "Calcula el potencial de tu negocio, proyecta ventas a 12 meses, analiza Unit Economics y genera reportes PDF detallados.",
      icon: TrendingUp,
      href: "/dashboard/business-validator",
      color: "text-purple-500"
    }
  ]

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-foreground mb-4">¿Qué necesitas hoy?</h1>
        <p className="text-lg text-gray-500">Selecciona la herramienta con la que deseas trabajar hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tools.map((tool, idx) => (
          <Link href={tool.href} key={idx} className="group h-full">
            <div className="bg-white rounded-3xl p-8 border border-secondary/20 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between hover:-translate-y-1">
              <div>
                <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <tool.icon className={`w-8 h-8 ${tool.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{tool.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-8 text-sm">{tool.description}</p>
              </div>
              
              <div className="flex items-center text-secondary font-semibold group-hover:text-[#8a9470] transition-colors">
                Ingresar a la herramienta <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
