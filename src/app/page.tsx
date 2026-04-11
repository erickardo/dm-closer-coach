import Link from 'next/link'
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-fixed bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#b4bfa5]/40 via-[#faf9f5]/90 to-[#faf9f5] flex flex-col font-sans relative">
      <div className="absolute inset-0 bg-fixed bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay pointer-events-none z-0" />
      <header className="mx-4 md:mx-8 mt-4 px-6 py-4 bg-white/50 backdrop-blur-2xl border border-secondary/20 rounded-[2rem] shadow-sm flex justify-between items-center sticky top-4 z-50">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Company Logo" className="h-8 w-auto object-contain" />
        </Link>
        <nav>
          <Link href="/login" className="text-sm font-medium hover:text-[#7c886b] transition-colors px-4 py-2">
            Iniciar Sesión
          </Link>
          <Link href="/login" className="bg-foreground text-background text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors ml-2 shadow-sm">
            Comenzar Gratis
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md text-secondary text-sm font-bold mb-8 border border-secondary/20 shadow-sm">
          <Sparkles className="w-4 h-4" /> Actúa hoy y multiplica tus ventas
        </div>
        
        <h1 className="font-heading text-5xl md:text-7xl font-extrabold max-w-4xl tracking-tight leading-[1.1] mb-6 text-foreground">
          Todas las herramientas que necesitas para hacer crecer tu negocio, <span className="text-secondary">están aquí.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-10 font-sans font-light">
          Un ecosistema completo de Micro-SaaS con IA diseñado para emprendedores. Analiza tus DMs, genera copy de alta conversión, y valida tus modelos de negocio en un solo lugar.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/login" className="bg-secondary hover:bg-[#a3ae94] text-[#111111] font-semibold text-lg px-8 py-4 rounded-full transition-colors flex justify-center items-center shadow-md">
            Acceder a mis herramientas <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl text-left w-full">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-secondary/10 shadow-sm transition hover:shadow-md">
            <CheckCircle2 className="text-secondary w-8 h-8 mb-5" />
            <h3 className="font-sans tracking-tight text-xl font-black mb-3 text-[#111111]">Evaluación del Guion</h3>
            <p className="text-[#111111]/80 text-sm leading-relaxed">Validamos si estás anclando el precio y haciendo la pregunta fácil correcta, o solo estás dando datos aburridos sin cerrar.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-secondary/10 shadow-sm transition hover:shadow-md">
            <CheckCircle2 className="text-secondary w-8 h-8 mb-5" />
            <h3 className="font-sans tracking-tight text-xl font-black mb-3 text-[#111111]">Rescates Automáticos</h3>
            <p className="text-[#111111]/80 text-sm leading-relaxed">¿Te dejaron en visto? La IA te da el guion exacto basado en empatía y escasez para revivir esa conversación valiosa 24 horas después.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-secondary/10 shadow-sm transition hover:shadow-md">
            <CheckCircle2 className="text-secondary w-8 h-8 mb-5" />
            <h3 className="font-sans tracking-tight text-xl font-black mb-3 text-[#111111]">Respuestas Maestras</h3>
            <p className="text-[#111111]/80 text-sm leading-relaxed">No adivines qué decir en el cierre. Obtén 2 variaciones perfectas de lo que debiste haber dicho para mantener el control completo de la venta.</p>
          </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-gray-500 text-sm bg-transparent relative z-10">
        © {new Date().getFullYear()} DM Closer Coach. Diseñado para cerrar más ventas.
      </footer>
    </div>
  )
}
