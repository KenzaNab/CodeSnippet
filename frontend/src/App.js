import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

const AuthCtx = createContext();
const LANGS = ['JavaScript','TypeScript','Python','Java','C#','PHP','Groovy','SQL','HTML','CSS','Bash','JSON','Other'];
const LANG_COLORS = { JavaScript:'#f7df1e', TypeScript:'#3178c6', Python:'#3572A5', Java:'#b07219', 'C#':'#178600', PHP:'#4F5D95', Groovy:'#e69f56', SQL:'#e38c00', HTML:'#e34c26', CSS:'#563d7c', Bash:'#89e051', JSON:'#292929', Other:'#8b949e' };

function useAuth() { return useContext(AuthCtx); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('cs_user')); } catch { return null; } });
  useEffect(() => { const t = localStorage.getItem('cs_token'); if (t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`; }, []);
  const set = (token, u) => { localStorage.setItem('cs_token', token); localStorage.setItem('cs_user', JSON.stringify(u)); axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; setUser(u); };
  const login = async (e, p) => { const { data } = await axios.post('/api/auth/login', { email: e, password: p }); set(data.token, data.user); };
  const register = async (n, e, p) => { const { data } = await axios.post('/api/auth/register', { name: n, email: e, password: p }); set(data.token, data.user); };
  const logout = () => { localStorage.clear(); delete axios.defaults.headers.common['Authorization']; setUser(null); };
  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [f, setF] = useState({ name:'', email:'', password:'' });
  const [err, setErr] = useState('');
  const { login, register } = useAuth();
  const handle = async (e) => { e.preventDefault(); setErr(''); try { isLogin ? await login(f.email, f.password) : await register(f.name, f.email, f.password); } catch(e) { setErr(e.response?.data?.error||'Error'); } };
  const inp = { width:'100%', padding:'10px 12px', border:'1px solid #30363d', borderRadius:8, fontSize:14, marginBottom:12, background:'#0d1117', color:'#c9d1d9', outline:'none', boxSizing:'border-box' };
  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#161b22', borderRadius:16, padding:'2.5rem', width:380, border:'1px solid #30363d' }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:'#58a6ff', marginBottom:4 }}>CodeSnippet</h1>
        <p style={{ color:'#8b949e', fontSize:14, marginBottom:24 }}>{isLogin?'Sign in to your snippets':'Create your account'}</p>
        {err && <p style={{ color:'#f85149', fontSize:13, marginBottom:12 }}>{err}</p>}
        <form onSubmit={handle}>
          {!isLogin && <input style={inp} placeholder="Name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} />}
          <input style={inp} type="email" placeholder="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} />
          <input style={inp} type="password" placeholder="Password" value={f.password} onChange={e=>setF({...f,password:e.target.value})} />
          <button style={{ width:'100%', padding:11, background:'#238636', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer' }}>{isLogin?'Sign in':'Register'}</button>
        </form>
        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#8b949e' }}>
          {isLogin?'No account? ':'Have account? '}<span style={{ color:'#58a6ff', cursor:'pointer' }} onClick={()=>setIsLogin(!isLogin)}>{isLogin?'Sign up':'Sign in'}</span>
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({ title:'', code:'', language:'JavaScript', description:'', tags:'', is_public: false });

  const load = async () => {
    const params = {};
    if (search) params.search = search;
    if (filterLang) params.lang = filterLang;
    const { data } = await axios.get('/api/snippets', { params });
    setSnippets(data);
  };

  useEffect(() => { load(); }, [search, filterLang]);

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) };
    if (editing) await axios.put(`/api/snippets/${editing.id}`, payload);
    else await axios.post('/api/snippets', payload);
    setShowForm(false); setEditing(null); setForm({ title:'', code:'', language:'JavaScript', description:'', tags:'', is_public:false });
    load();
  };

  const del = async (id) => { await axios.delete(`/api/snippets/${id}`); load(); };

  const copy = (code, id) => { navigator.clipboard.writeText(code); setCopied(id); setTimeout(()=>setCopied(''), 2000); };

  const startEdit = (s) => { setEditing(s); setForm({ title:s.title, code:s.code, language:s.language, description:s.description||'', tags:s.tags.join(', '), is_public:s.is_public }); setShowForm(true); };

  const nav = { background:'#161b22', borderBottom:'1px solid #30363d', padding:'0 1.5rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' };
  const inp = (extra={}) => ({ padding:'8px 12px', border:'1px solid #30363d', borderRadius:8, fontSize:13, background:'#0d1117', color:'#c9d1d9', outline:'none', ...extra });
  const card = { background:'#161b22', border:'1px solid #30363d', borderRadius:12, marginBottom:12, overflow:'hidden' };

  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', color:'#c9d1d9', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <nav style={nav}>
        <span style={{ color:'#58a6ff', fontWeight:700, fontSize:18 }}>CodeSnippet</span>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ color:'#8b949e', fontSize:14 }}>{user?.name}</span>
          <button onClick={()=>{setEditing(null);setForm({title:'',code:'',language:'JavaScript',description:'',tags:'',is_public:false});setShowForm(true)}} style={{ background:'#238636', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ New Snippet</button>
          <button onClick={logout} style={{ background:'rgba(255,255,255,0.08)', color:'#c9d1d9', border:'none', borderRadius:8, padding:'6px 12px', fontSize:13, cursor:'pointer' }}>Logout</button>
        </div>
      </nav>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem' }}>
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <input style={inp({ flex:1 })} placeholder="Search snippets..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select value={filterLang} onChange={e=>setFilterLang(e.target.value)} style={inp()}>
            <option value="">All languages</option>
            {LANGS.map(l=><option key={l}>{l}</option>)}
          </select>
        </div>
        {snippets.map(s => (
          <div key={s.id} style={card}>
            <div style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #21262d' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:LANG_COLORS[s.language]||'#8b949e', display:'inline-block' }} />
                <span style={{ fontWeight:600, fontSize:15, color:'#e6edf3' }}>{s.title}</span>
                <span style={{ fontSize:12, color:'#8b949e', background:'#21262d', padding:'2px 8px', borderRadius:20 }}>{s.language}</span>
                {s.is_public && <span style={{ fontSize:11, color:'#3fb950', background:'rgba(63,185,80,0.1)', padding:'2px 8px', borderRadius:20 }}>public</span>}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>copy(s.code, s.id)} style={{ background:'#21262d', color: copied===s.id ? '#3fb950':'#c9d1d9', border:'none', borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer' }}>{copied===s.id?'Copied!':'Copy'}</button>
                <button onClick={()=>startEdit(s)} style={{ background:'#21262d', color:'#c9d1d9', border:'none', borderRadius:6, padding:'4px 10px', fontSize:12, cursor:'pointer' }}>Edit</button>
                <button onClick={()=>del(s.id)} style={{ background:'none', color:'#8b949e', border:'none', borderRadius:6, padding:'4px 8px', fontSize:14, cursor:'pointer' }}>×</button>
              </div>
            </div>
            {s.description && <p style={{ padding:'8px 16px 0', fontSize:13, color:'#8b949e' }}>{s.description}</p>}
            <pre style={{ margin:0, padding:'12px 16px', overflowX:'auto', fontSize:13, lineHeight:1.6, background:'#0d1117', color:'#c9d1d9', fontFamily:'"Fira Code","Cascadia Code",monospace' }}><code>{s.code}</code></pre>
            {s.tags.length > 0 && (
              <div style={{ padding:'8px 16px 12px' }}>
                {s.tags.map(t=><span key={t} style={{ display:'inline-block', background:'#21262d', color:'#8b949e', fontSize:11, padding:'2px 8px', borderRadius:20, marginRight:4 }}>#{t}</span>)}
              </div>
            )}
          </div>
        ))}
        {snippets.length === 0 && <p style={{ color:'#8b949e', textAlign:'center', marginTop:40 }}>No snippets yet. Create your first one!</p>}
      </div>
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#161b22', borderRadius:16, padding:'2rem', width:580, maxHeight:'90vh', overflowY:'auto', border:'1px solid #30363d' }}>
            <h3 style={{ fontSize:18, fontWeight:600, color:'#e6edf3', marginBottom:20 }}>{editing?'Edit Snippet':'New Snippet'}</h3>
            <form onSubmit={save}>
              <input style={{ ...inp({ width:'100%', boxSizing:'border-box', marginBottom:12 }) }} placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
              <select value={form.language} onChange={e=>setForm({...form,language:e.target.value})} style={{ ...inp({ width:'100%', boxSizing:'border-box', marginBottom:12 }) }}>
                {LANGS.map(l=><option key={l}>{l}</option>)}
              </select>
              <textarea value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="Paste your code here..." required style={{ ...inp({ width:'100%', boxSizing:'border-box', height:200, resize:'vertical', fontFamily:'monospace', marginBottom:12 }) }} />
              <input style={{ ...inp({ width:'100%', boxSizing:'border-box', marginBottom:12 }) }} placeholder="Description (optional)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              <input style={{ ...inp({ width:'100%', boxSizing:'border-box', marginBottom:12 }) }} placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, color:'#8b949e', marginBottom:16, cursor:'pointer' }}>
                <input type="checkbox" checked={form.is_public} onChange={e=>setForm({...form,is_public:e.target.checked})} />
                Make public
              </label>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" style={{ background:'#238636', color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }}>Save</button>
                <button type="button" onClick={()=>{setShowForm(false);setEditing(null);}} style={{ background:'#21262d', color:'#c9d1d9', border:'none', borderRadius:8, padding:'9px 20px', fontSize:14, cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AppInner() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
