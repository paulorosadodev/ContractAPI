import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, Boxes, GitBranch, Users, Shield, FileJson, Globe, FolderTree, Copy, Check, ChevronRight, Terminal, Sparkles, RefreshCw, Eye } from "lucide-react";

interface LandingPageProps {
    onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
    const [copied, setCopied] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    // Auto-rotate features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-(--app-bg) text-(--app-fg) overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-(--app-border) bg-(--app-bg)/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 rounded-lg bg-(--app-accent)/20 border border-(--app-accent)/30">
                                <Code2 className="size-6 text-(--app-accent)" />
                            </div>
                            <span className="text-xl font-bold">
                                Contract<span className="text-(--app-accent)">API</span>
                            </span>
                        </div>
                        <button onClick={onEnterApp} className="flex items-center gap-2 px-4 py-2 bg-(--app-accent) text-white rounded-lg font-medium hover:bg-(--app-accent)/90 transition-colors cursor-pointer">
                            Acessar App
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--app-surface) border border-(--app-border) text-sm text-(--app-muted) mb-8">
                            <Sparkles className="size-4 text-(--app-accent)" />
                            <span>De devs para devs</span>
                            <span className="text-(--app-accent)">•</span>
                            <span>Open Source</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                            Defina contratos de API
                            <br />
                            <span className="text-(--app-accent)">antes de escrever código</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg sm:text-xl text-(--app-muted) mb-10 max-w-2xl mx-auto">
                            ContractAPI é uma ferramenta visual para criar e documentar interfaces, tipos e endpoints da sua API. Sincronização em tempo real, exportação para TypeScript e JSON.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={onEnterApp} className="flex items-center gap-2 px-6 py-3 bg-(--app-accent) text-white rounded-lg font-semibold text-lg hover:bg-(--app-accent)/90 transition-all hover:scale-105 cursor-pointer">
                                Começar Agora
                                <ChevronRight className="size-5" />
                            </button>
                            <a href="https://github.com/paulorosadodev/ContractAPI" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-(--app-surface) border border-(--app-border) rounded-lg font-medium hover:bg-(--app-surface-2) transition-colors cursor-pointer">
                                <GitBranch className="size-5" />
                                Ver no GitHub
                            </a>
                        </motion.div>
                    </div>

                    {/* Code Preview */}
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-16 max-w-4xl mx-auto">
                        <div className="rounded-xl border border-(--app-border) overflow-hidden shadow-2xl shadow-black/20">
                            <div className="flex items-center justify-between px-4 py-3 bg-(--app-surface-2) border-b border-(--app-border)">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-red-500" />
                                    <div className="size-3 rounded-full bg-yellow-500" />
                                    <div className="size-3 rounded-full bg-green-500" />
                                </div>
                                <span className="text-xs text-(--app-muted) font-mono">User.ts</span>
                                <button onClick={() => handleCopy(codeExample)} className="flex items-center gap-1 text-xs text-(--app-muted) hover:text-(--app-fg) cursor-pointer">
                                    {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                    {copied ? "Copiado!" : "Copiar"}
                                </button>
                            </div>
                            <pre className="p-6 text-sm font-mono overflow-x-auto bg-(--code-bg)">
                                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                            </pre>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Problem/Solution Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-(--app-surface)">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">O problema que resolvemos</h2>
                        <p className="text-(--app-muted) text-lg max-w-2xl mx-auto">Quantas vezes você já teve que refatorar código porque o contrato da API não estava bem definido?</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Before */}
                        <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="size-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <Terminal className="size-4 text-red-400" />
                                </div>
                                <span className="font-semibold text-red-400">Sem ContractAPI</span>
                            </div>
                            <ul className="space-y-3 text-(--app-muted)">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span>Frontend e backend desenvolvem sem alinhamento</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span>Tipos duplicados em vários lugares</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span>Documentação desatualizada ou inexistente</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span>Mudanças de contrato quebram integrações</span>
                                </li>
                            </ul>
                        </div>

                        {/* After */}
                        <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="size-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <Sparkles className="size-4 text-green-400" />
                                </div>
                                <span className="font-semibold text-green-400">Com ContractAPI</span>
                            </div>
                            <ul className="space-y-3 text-(--app-muted)">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Contrato definido antes do código</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Tipos TypeScript gerados automaticamente</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Documentação sempre sincronizada</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Colaboração em tempo real</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Todas as funcionalidades</h2>
                        <p className="text-(--app-muted) text-lg max-w-2xl mx-auto">Tudo que você precisa para definir e documentar sua API</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} className={`p-6 rounded-xl border transition-all cursor-pointer ${activeFeature === index ? "border-(--app-accent) bg-(--app-accent)/10" : "border-(--app-border) bg-(--app-surface) hover:border-(--app-accent)/50"}`} onClick={() => setActiveFeature(index)}>
                                <div className={`size-12 rounded-lg flex items-center justify-center mb-4 ${activeFeature === index ? "bg-(--app-accent)/20" : "bg-(--app-surface-2)"}`}>
                                    <feature.icon className={`size-6 ${activeFeature === index ? "text-(--app-accent)" : "text-(--app-muted)"}`} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-(--app-muted) text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-(--app-surface)">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Como funciona</h2>
                        <p className="text-(--app-muted) text-lg max-w-2xl mx-auto">Simples, rápido e direto ao ponto</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={step.title} className="text-center">
                                <div className="inline-flex items-center justify-center size-16 rounded-full bg-(--app-accent)/20 border-2 border-(--app-accent) text-(--app-accent) text-2xl font-bold mb-4">{index + 1}</div>
                                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                <p className="text-(--app-muted)">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">Construído com tecnologias modernas</h2>
                    <p className="text-(--app-muted) text-lg max-w-2xl mx-auto mb-12">Stack moderna para máxima performance e experiência de desenvolvimento</p>

                    <div className="flex flex-wrap items-center justify-center gap-8">
                        {techStack.map((tech) => (
                            <div key={tech.name} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--app-surface) border border-(--app-border)">
                                <span className="text-2xl">{tech.icon}</span>
                                <span className="font-medium">{tech.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="p-8 sm:p-12 rounded-2xl bg-linear-to-br from-(--app-accent)/20 to-(--app-surface) border border-(--app-accent)/30">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pronto para começar?</h2>
                        <p className="text-(--app-muted) text-lg mb-8 max-w-xl mx-auto">Comece a definir seus contratos de API agora mesmo. É grátis e não precisa de cadastro.</p>
                        <button onClick={onEnterApp} className="inline-flex items-center gap-2 px-8 py-4 bg-(--app-accent) text-white rounded-xl font-semibold text-lg hover:bg-(--app-accent)/90 transition-all hover:scale-105 cursor-pointer">
                            Acessar ContractAPI
                            <ChevronRight className="size-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-(--app-border)">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Code2 className="size-5 text-(--app-accent)" />
                        <span className="font-medium">ContractAPI</span>
                    </div>
                    <p className="text-sm text-(--app-muted)">
                        Desenvolvido por{" "}
                        <a href="https://github.com/paulorosadodev" target="_blank" rel="noopener noreferrer" className="text-(--app-accent) hover:underline">
                            Paulo Rosado
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Data
const features = [
    {
        icon: Boxes,
        title: "Interfaces & Types",
        description: "Crie interfaces e types TypeScript visualmente, com suporte a campos opcionais, arrays e referências.",
    },
    {
        icon: FileJson,
        title: "Enums",
        description: "Defina enums para status, categorias e valores fixos. Validação automática de nomenclatura.",
    },
    {
        icon: Globe,
        title: "Endpoints",
        description: "Configure endpoints REST com método, path, query params, request body e response body.",
    },
    {
        icon: FolderTree,
        title: "Coleções",
        description: "Organize seus objetos e endpoints em coleções e subcoleções hierárquicas.",
    },
    {
        icon: Shield,
        title: "Roles & Permissões",
        description: "Defina roles e associe permissões mínimas a cada endpoint para documentar autorizações.",
    },
    {
        icon: RefreshCw,
        title: "Sync em Tempo Real",
        description: "Colabore com sua equipe em tempo real via WebSocket. Veja mudanças instantaneamente.",
    },
    {
        icon: Code2,
        title: "Export TypeScript",
        description: "Exporte interfaces, types e enums prontos para copiar e colar no seu código.",
    },
    {
        icon: Eye,
        title: "Preview JSON",
        description: "Visualize como seus objetos ficam em JSON com syntax highlighting.",
    },
    {
        icon: Users,
        title: "Multi-usuário",
        description: "Veja quantos usuários estão conectados e trabalhando na mesma documentação.",
    },
];

const steps = [
    {
        title: "Crie suas interfaces",
        description: "Defina os objetos da sua API com campos, tipos e validações.",
    },
    {
        title: "Configure endpoints",
        description: "Mapeie os endpoints REST com seus contratos de request e response.",
    },
    {
        title: "Exporte e use",
        description: "Copie o código TypeScript gerado direto para seu projeto.",
    },
];

const techStack = [
    { name: "React", icon: "⚛️" },
    { name: "TypeScript", icon: "📘" },
    { name: "Tailwind CSS", icon: "🎨" },
    { name: "WebSocket", icon: "🔌" },
    { name: "Framer Motion", icon: "✨" },
    { name: "Node.js", icon: "🟢" },
];

const codeExample = `export interface User {
  id: string;
  name: string;
  email: string;
  role?: Role;
  createdAt: Date;
}

export enum Role {
  ADMIN,
  USER,
  GUEST,
}`;

const highlightedCode = `<span style="color:var(--code-keyword)">export</span> <span style="color:var(--code-keyword)">interface</span> <span style="color:var(--code-type)">User</span> <span style="color:var(--code-punctuation)">{</span>
  <span style="color:var(--code-property)">id</span><span style="color:var(--code-punctuation)">:</span> <span style="color:var(--code-type)">string</span><span style="color:var(--code-punctuation)">;</span>
  <span style="color:var(--code-property)">name</span><span style="color:var(--code-punctuation)">:</span> <span style="color:var(--code-type)">string</span><span style="color:var(--code-punctuation)">;</span>
  <span style="color:var(--code-property)">email</span><span style="color:var(--code-punctuation)">:</span> <span style="color:var(--code-type)">string</span><span style="color:var(--code-punctuation)">;</span>
  <span style="color:var(--code-property)">role</span><span style="color:var(--code-string)">?</span><span style="color:var(--code-punctuation)">:</span> <span style="color:var(--code-type)">Role</span><span style="color:var(--code-punctuation)">;</span>
  <span style="color:var(--code-property)">createdAt</span><span style="color:var(--code-punctuation)">:</span> <span style="color:var(--code-type)">Date</span><span style="color:var(--code-punctuation)">;</span>
<span style="color:var(--code-punctuation)">}</span>

<span style="color:var(--code-keyword)">export</span> <span style="color:var(--code-keyword)">enum</span> <span style="color:var(--code-type)">Role</span> <span style="color:var(--code-punctuation)">{</span>
  <span style="color:var(--code-property)">ADMIN</span><span style="color:var(--code-punctuation)">,</span>
  <span style="color:var(--code-property)">USER</span><span style="color:var(--code-punctuation)">,</span>
  <span style="color:var(--code-property)">GUEST</span><span style="color:var(--code-punctuation)">,</span>
<span style="color:var(--code-punctuation)">}</span>`;
