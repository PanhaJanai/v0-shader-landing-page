"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Mail, 
  ExternalLink, 
  Briefcase, 
  Code2, 
  MapPin, 
  Server, 
  Globe, 
  Calendar, 
  MessageSquare, 
  Check, 
  Loader2, 
  Terminal, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Compass,
  Laptop
} from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"

// Predefined color palette for charts
const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"]

const languageData = [
  { name: "TypeScript / JS", value: 45 },
  { name: "Go Lang", value: 25 },
  { name: "Python", value: 20 },
  { name: "Rust", value: 10 }
]

// Mock projects data
const projects = [
  {
    id: 1,
    title: "AetherCloud Dashboard",
    description: "A high-performance cloud orchestration and serverless server management platform. Allows real-time visualization of container topology, automated scale-down policies, and edge-native load balancing.",
    tags: ["Next.js", "Go Lang", "Kubernetes", "PostgreSQL"],
    image: "/images/project_architecture.jpg",
    link: "https://github.com",
    live: "https://example.com"
  },
  {
    id: 2,
    title: "Neovim Dev Terminal",
    description: "A customized web-based developer console and interactive dev environment. Features hot module reloading visualization, code linting analysis, and real-time execution pipelines.",
    tags: ["Rust", "WebGL", "TypeScript", "TailwindCSS"],
    image: "/images/project_terminal.jpg",
    link: "https://github.com",
    live: "https://example.com"
  }
]

// Mock experience timeline
const experience = [
  {
    role: "Senior Full-Stack Engineer",
    company: "TechCorp Global",
    period: "2024 - Present",
    desc: "Led development of real-time trading dashboards. Optimized site speed by 40% using incremental static regeneration and edge routing. Mentored 5 developers."
  },
  {
    role: "Software Architect",
    company: "DevsUnited",
    period: "2022 - 2024",
    desc: "Designed microservice pipelines handling over 10M daily requests. Deployed custom Dockerized orchestration systems reducing cloud spend by 25%."
  },
  {
    role: "Frontend Engineer",
    company: "Creative Labs",
    period: "2020 - 2022",
    desc: "Built modern animated web experiences using React, Three.js, and Framer Motion. Engineered modular visual design libraries used across 6 products."
  }
]

// Custom interactive terminal commands
const commandAnswers: Record<string, string> = {
  help: "Available commands: 'about', 'skills', 'projects', 'secret', 'clear'",
  about: "Panha Janai - Senior Full-Stack Engineer. Passionate about beautiful interfaces and scalable systems.",
  skills: "Frontend: React, Next.js, TS. Backend: Node.js, Go, Python. Infrastructure: AWS, Docker, Kubernetes.",
  projects: "1. AetherCloud (Go/Next.js) | 2. Neovim Dev Terminal (Rust/WebGL)",
  secret: "🎉 Fun Fact: I built my first web app in PHP back in 2015, and I still love writing raw CSS animations!",
  clear: ""
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeProject, setActiveProject] = useState(0)
  
  // Terminal state
  const [terminalInput, setTerminalInput] = useState("")
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; output: string }>>([
    { cmd: "system --init", output: "Welcome to Panha's Portfolio Console. Type 'help' for a list of available commands." }
  ])
  const terminalBottomRef = useRef<HTMLDivElement>(null)

  // GitHub grid contribution heatmap mock generator
  const [gitHoverCell, setGitHoverCell] = useState<{ count: number; date: string } | null>(null)
  const [heatmapCells, setHeatmapCells] = useState<Array<{ count: number; level: number; date: string }>>([])

  // Contact form state
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactMsg, setContactMsg] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Generate mock GitHub heatmap cells
    const cells = []
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() - 371) // Go back ~53 weeks

    for (let i = 0; i < 371; i++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() + i)
      const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      
      // Random-looking but consistent pattern for contributions
      const dayOfWeek = date.getDay()
      let count = 0
      if (Math.random() > 0.3) {
        count = Math.floor(Math.random() * 8)
        if (dayOfWeek === 2 || dayOfWeek === 4) count += Math.floor(Math.random() * 4) // Tuesday/Thursday peak
      }
      
      let level = 0
      if (count > 0 && count <= 2) level = 1
      else if (count > 2 && count <= 5) level = 2
      else if (count > 5 && count <= 8) level = 3
      else if (count > 8) level = 4

      cells.push({
        count,
        level,
        date: dateString
      })
    }
    setHeatmapCells(cells)
  }, [])

  // Auto-scroll terminal history
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [terminalHistory])

  const nextProject = () => {
    setActiveProject((prev) => (prev + 1) % projects.length)
  }

  const prevProject = () => {
    setActiveProject((prev) => (prev - 1 + projects.length) % projects.length)
  }

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = terminalInput.trim().toLowerCase()
    if (!trimmed) return

    if (trimmed === "clear") {
      setTerminalHistory([])
      setTerminalInput("")
      return
    }

    const output = commandAnswers[trimmed] || `Command not found: '${trimmed}'. Type 'help' for support.`
    setTerminalHistory((prev) => [...prev, { cmd: terminalInput, output }])
    setTerminalInput("")
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName || !contactEmail || !contactMsg) return
    setIsSending(true)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSending(false)
    setIsSent(true)

    // Reset fields after some time
    setTimeout(() => {
      setContactName("")
      setContactEmail("")
      setContactMsg("")
      setIsSent(false)
    }, 4000)
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0a0f] text-slate-100 font-sans selection:bg-purple-600 selection:text-white pb-12">
      {/* Background Gradients and Grid Mesh */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950/20 to-[#0a0a0f]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)]" />

      {/* Decorative Blur Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform duration-300">
            <span className="font-bold text-white text-base tracking-wider">PJ</span>
          </div>
          <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 group-hover:text-white transition-colors">
            Panha Janai
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="mailto:contact@panha.dev"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-medium tracking-wide text-slate-300 hover:text-white transition-all duration-300"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email Me</span>
          </a>
        </div>
      </nav>

      {/* Bento Grid Layout Wrapper */}
      <div className="max-w-7xl mx-auto px-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
          
          {/* Card 1: Intro / Bio (Col-span 2, Row-span 2) */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between group transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.04]">
            {/* Top Grid Border Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-white/15 bg-slate-900 shadow-md">
                  <Image 
                    src="/images/developer_profile.jpg" 
                    alt="Developer Avatar" 
                    fill 
                    sizes="80px"
                    priority
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-purple-400 font-semibold tracking-wider uppercase">Available for work</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mt-1">Panha Janai</h1>
                  <p className="text-slate-400 text-sm font-medium">Senior Full-Stack & Creative Developer</p>
                </div>
              </div>
              
              <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                I build high-performance web products, interactive digital interfaces, and modern backend systems. Focused on crafting clean code, efficient architectures, and immersive front-end layouts.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-slate-400 font-medium">Phnom Penh, Cambodia (GMT+7)</span>
              </div>
              <div className="flex items-center gap-3">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-slate-400 hover:text-white border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                  <Github className="h-4 w-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-slate-400 hover:text-white border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-purple-600/20 text-slate-400 hover:text-white border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Tech Stack (Col-span 2, Row-span 1) */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between group transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Interactive Tech Stack</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active usage</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {[
                { name: "React / Next.js", level: "Advanced", color: "from-blue-500/10 to-blue-500/5 hover:border-blue-500/40" },
                { name: "TypeScript", level: "Expert", color: "from-blue-500/10 to-indigo-500/5 hover:border-indigo-500/40" },
                { name: "Go Lang", level: "Intermediate", color: "from-cyan-500/10 to-teal-500/5 hover:border-teal-500/40" },
                { name: "Python", level: "Advanced", color: "from-yellow-500/10 to-orange-500/5 hover:border-orange-500/40" },
                { name: "Rust", level: "Explorer", color: "from-red-500/10 to-purple-500/5 hover:border-purple-500/40" },
                { name: "AWS / Docker", level: "Advanced", color: "from-sky-500/10 to-blue-500/5 hover:border-sky-500/40" },
              ].map((skill, index) => (
                <div 
                  key={index} 
                  className={`p-2.5 rounded-xl border border-white/5 bg-gradient-to-br ${skill.color} transition-all duration-300 hover:-translate-y-0.5 cursor-default group/skill`}
                >
                  <p className="text-xs font-semibold text-slate-200 group-hover/skill:text-white transition-colors">{skill.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium group-hover/skill:text-slate-400">{skill.level}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: GitHub contribution heat map (Col-span 2, Row-span 1) */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between group transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">Contributions heatmap</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                1,424 commits past year
              </span>
            </div>

            {/* Heatmap Grid */}
            <div className="relative mt-2 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-1 min-w-[500px]">
                {/* Custom layout: weeks */}
                <div className="grid grid-flow-col grid-rows-7 gap-1 w-full">
                  {heatmapCells.map((cell, index) => {
                    let cellBg = "bg-white/5 hover:bg-white/10"
                    if (cell.level === 1) cellBg = "bg-emerald-950/60 border border-emerald-800/20 hover:bg-emerald-900"
                    else if (cell.level === 2) cellBg = "bg-emerald-800/80 border border-emerald-700/20 hover:bg-emerald-700"
                    else if (cell.level === 3) cellBg = "bg-emerald-600 hover:bg-emerald-500"
                    else if (cell.level === 4) cellBg = "bg-emerald-400 hover:bg-emerald-300 shadow-sm shadow-emerald-500/20"

                    return (
                      <div
                        key={index}
                        className={`h-2.5 w-2.5 rounded-[1.5px] transition-colors cursor-pointer duration-150 ${cellBg}`}
                        onMouseEnter={() => setGitHoverCell({ count: cell.count, date: cell.date })}
                        onMouseLeave={() => setGitHoverCell(null)}
                      />
                    )
                  })}
                </div>
              </div>
              
              {/* Heatmap Legend & Tooltip info */}
              <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                  <span>Less</span>
                  <div className="h-2 w-2 rounded-[1px] bg-white/5" />
                  <div className="h-2 w-2 rounded-[1px] bg-emerald-950/60" />
                  <div className="h-2 w-2 rounded-[1px] bg-emerald-800/80" />
                  <div className="h-2 w-2 rounded-[1px] bg-emerald-600" />
                  <div className="h-2 w-2 rounded-[1px] bg-emerald-400" />
                  <span>More</span>
                </div>
                
                <div className="h-4 flex items-center">
                  {gitHoverCell ? (
                    <span className="font-mono text-slate-300 text-[10px] animate-fade-in">
                      {gitHoverCell.count} commits on {gitHoverCell.date}
                    </span>
                  ) : (
                    <span className="font-mono text-slate-600">Hover blocks to view daily contributions</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Language Donut Chart Card (Col-span 1, Row-span 2) */}
          <div className="lg:col-span-1 lg:row-span-2 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between group transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.04]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Compass className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
                <h3 className="font-semibold text-white text-sm">Work Split</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Distribution of time spent coding across languages in the past 6 months.
              </p>
            </div>

            {/* Recharts container with hydration prevention */}
            <div className="h-40 w-full flex items-center justify-center my-4">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: "#0a0a0f", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
                      itemStyle={{ color: "#cbd5e1", fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-slate-600 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {languageData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-slate-400 font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-200 font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Projects Slider (Col-span 2, Row-span 2) */}
          <div className="lg:col-span-2 lg:row-span-2 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between group transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.04]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4.5 w-4.5 text-purple-400" />
                  <h3 className="font-semibold text-white text-sm">Featured Work</h3>
                </div>
                
                {/* Control Arrows */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                  <button 
                    onClick={prevProject} 
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={nextProject} 
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Slider View */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group/img bg-slate-950">
                <Image 
                  src={projects[activeProject].image} 
                  alt={projects[activeProject].title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover/img:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {projects[activeProject].tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-base font-bold text-white tracking-wide">{projects[activeProject].title}</h4>
                </div>
              </div>

              <p className="text-slate-300 text-xs mt-3.5 leading-relaxed min-h-[50px]">
                {projects[activeProject].description}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-4">
              <a 
                href={projects[activeProject].link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium group/link transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
                <span>Source Code</span>
                <ArrowRight className="h-3 w-3 -rotate-45 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </a>
              <a 
                href={projects[activeProject].live} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold group/link transition-colors"
              >
                <span>Live Preview</span>
                <ExternalLink className="h-3.5 w-3.5 group-hover/link:scale-105 transition-transform" />
              </a>
            </div>
          </div>

          {/* Card 6: Work History (Col-span 1, Row-span 2) */}
          <div className="lg:col-span-1 lg:row-span-2 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between group transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.04]">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Experience</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Highlights of my software engineering track record.
              </p>
            </div>

            {/* Timeline List */}
            <div className="flex flex-col gap-4 mt-2 h-full justify-center">
              {experience.map((exp, index) => (
                <div key={index} className="flex gap-3 relative group/item">
                  {/* Visual Line */}
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 border border-blue-400 group-hover/item:scale-125 transition-transform" />
                    {index < experience.length - 1 && (
                      <div className="w-[1px] h-full bg-white/10 mt-1" />
                    )}
                  </div>
                  <div className="flex flex-col pb-2">
                    <span className="font-mono text-[10px] text-slate-500">{exp.period}</span>
                    <span className="text-xs font-bold text-slate-200 mt-0.5 group-hover/item:text-blue-400 transition-colors">{exp.role}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{exp.company}</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1 hidden group-hover/item:block animate-slide-in-from-bottom-2 duration-300">
                      {exp.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/5 pt-3 text-[10px] text-slate-500 text-center italic mt-2">
              Hover items to reveal descriptions
            </div>
          </div>

          {/* Card 7: Interactive Terminal Sandbox (Col-span 2, Row-span 1) */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between group transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">Interactive Shell</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500/70" />
                <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
                <span className="h-2 w-2 rounded-full bg-green-500/70" />
              </div>
            </div>

            {/* Terminal Window content */}
            <div className="bg-slate-950/65 rounded-xl border border-white/5 p-3 font-mono text-xs h-32 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
              {terminalHistory.map((item, index) => (
                <div key={index} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-emerald-500 font-semibold">$</span>
                    <span>{item.cmd}</span>
                  </div>
                  <div className="text-slate-300 whitespace-pre-line pl-3 border-l border-emerald-500/20 py-0.5">
                    {item.output}
                  </div>
                </div>
              ))}
              <div ref={terminalBottomRef} />
            </div>

            {/* Terminal Input Form */}
            <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 mt-3 bg-slate-950/50 rounded-lg px-3 py-1.5 border border-white/5 focus-within:border-emerald-500/40 transition-colors">
              <span className="font-mono text-xs text-emerald-500 font-semibold">$</span>
              <input
                type="text"
                placeholder="Try 'help', 'skills', 'about', or 'secret'..."
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                className="bg-transparent text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none w-full"
              />
              <button type="submit" className="hidden" />
            </form>
          </div>

          {/* Card 8: Connect Form (Col-span 2, Row-span 1) */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between group transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.04]">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4.5 w-4.5 text-purple-400" />
              <h3 className="font-semibold text-white text-sm">Let's Connect</h3>
            </div>

            {isSent ? (
              <div className="h-32 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-white">Message Transmitted!</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[240px]">Thanks for reaching out. I'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-2.5 h-full justify-between">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="bg-white/5 border border-white/5 focus:border-purple-500/40 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-white/5 border border-white/5 focus:border-purple-500/40 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Tell me about your project..."
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="bg-white/5 border border-white/5 focus:border-purple-500/40 rounded-lg px-3 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none transition-colors resize-none"
                />
                
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg hover:from-purple-500 hover:to-blue-400 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-purple-600/10"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Send Transmission</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Panha Janai. Designed in Bento-box grid style.</p>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
          <span>Powered by Next.js & Tailwind CSS</span>
        </div>
      </footer>
    </main>
  )
}
