import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Briefcase, 
  BarChart3, 
  Info, 
  Loader2, 
  Database,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Send,
  User,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { explainBpsData } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const QUICK_TOPICS = [
  { id: 'inflasi', label: 'Inflasi', icon: TrendingUp, query: 'Data inflasi terbaru di Indonesia' },
  { id: 'penduduk', label: 'Kependudukan', icon: Users, query: 'Jumlah penduduk Indonesia terbaru' },
  { id: 'ekonomi', label: 'Ekonomi', icon: BarChart3, query: 'Pertumbuhan ekonomi Indonesia kuartal terakhir' },
  { id: 'kemiskinan', label: 'Kemiskinan', icon: Briefcase, query: 'Tingkat kemiskinan di Indonesia' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

const ChartRenderer = ({ dataStr }: { dataStr: string }) => {
  try {
    const config = JSON.parse(dataStr);
    const { type, title, data, xAxis, yAxis } = config;

    return (
      <div className="my-6 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl overflow-hidden">
        {title && <h4 className="text-sm font-bold text-zinc-800 mb-4 text-center">{title}</h4>}
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f4f4f5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : type === 'bar' ? (
              <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f4f4f5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : type === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="label"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f4f4f5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              </PieChart>
            ) : null}
          </ResponsiveContainer>
        </div>
        {(xAxis || yAxis) && (
          <div className="mt-2 flex justify-center gap-4 text-[10px] text-zinc-400">
            {xAxis && <span>X: {xAxis}</span>}
            {yAxis && <span>Y: {yAxis}</span>}
          </div>
        )}
      </div>
    );
  } catch (e) {
    console.error("Failed to render chart:", e);
    return null;
  }
};

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim() || loading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: searchQuery
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setError(null);

    try {
      const data = await explainBpsData(searchQuery);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        sources: data.sources
      }]);
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-zinc-900 font-sans overflow-hidden">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-100 bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold tracking-tight">Statistik<span className="text-emerald-600">AI</span></span>
        </div>
        <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">BPS Data Assistant</div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto px-4 py-6 space-y-8 scroll-smooth"
      >
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
            <div className="bg-emerald-50 p-4 rounded-3xl">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Apa yang ingin Anda ketahui?</h2>
              <p className="text-sm text-zinc-500">Tanyakan tentang data statistik BPS Indonesia secara langsung.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 w-full">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleSearch(topic.query)}
                  className="flex items-center gap-2 p-3 text-left bg-zinc-50 border border-zinc-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                >
                  <topic.icon className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600" />
                  <span className="text-xs font-medium text-zinc-600 group-hover:text-emerald-700">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-3xl mx-auto",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-zinc-100" : "bg-emerald-600"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-500" /> : <Database className="w-4 h-4 text-white" />}
            </div>
            
            <div className={cn(
              "flex flex-col space-y-2 max-w-[85%]",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm",
                msg.role === 'user' 
                  ? "bg-zinc-100 text-zinc-800 rounded-tr-none" 
                  : "bg-white border border-zinc-100 text-zinc-800 rounded-tl-none shadow-sm"
              )}>
                {msg.role === 'assistant' ? (
                  <div className="markdown-body prose-sm">
                    <Markdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline && match && match[1] === 'chart-data') {
                            return <ChartRenderer dataStr={String(children).replace(/\n$/, '')} />;
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </Markdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-50 border border-zinc-100 rounded-md text-[10px] font-medium text-zinc-500 hover:text-emerald-600 transition-colors"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[120px]">{source.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center animate-pulse">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-zinc-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-100 p-3 rounded-xl text-red-600 text-xs flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-100 bg-white">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Tanyakan data BPS..."
            className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all text-sm resize-none"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-zinc-400 mt-2">
          AI dapat memberikan informasi yang tidak akurat. Verifikasi data di <a href="https://bps.go.id" target="_blank" className="underline">bps.go.id</a>
        </p>
      </div>
    </div>
  );
}
