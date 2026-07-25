import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Plus, X, BarChart2, BookOpen, Home, Search, Edit2, Trash2, Activity, Wallet, ChevronDown, Target, AlertCircle } from "lucide-react";

const TK = "rtj-trades-v4";
const AK = "rtj-accounts-v2";
async function load(key) { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } }
async function save(key, v) { try { await window.storage.set(key, JSON.stringify(v)); } catch(e) { console.error(e); } }

const C = { bg:"#080C14", card:"#0F1623", surface:"#16202E", border:"#1F2E42", win:"#00C896", loss:"#FF4560", be:"#F5A623", gold:"#F5A623", blue:"#4FACFE", purple:"#8B5CF6", text:"#DDE4F0", muted:"#4E637E", mutedLt:"#7C94AE" };
const ACCT_COLORS = ["#4FACFE","#00C896","#F5A623","#8B5CF6","#FF6B9D","#FF9F43","#54A0FF","#5F27CD"];
const rgba = (h, a) => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };

const FX_PAIRS = ["XAUUSD","XAGUSD","EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","NZDUSD","USDCAD","GBPJPY","EURJPY","EURGBP"];
const INDIA_SYM = ["NIFTY","BANKNIFTY","FINNIFTY","MIDCPNIFTY","SENSEX","RELIANCE","TCS","HDFCBANK","ICICIBANK","INFY","SBIN"];
const CRYPTO_SYM = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT"];
const SETUPS = ["CHoCH + OB","BOS + FVG","Demand Zone","Supply Zone","Strong Low","Strong High","Equal Highs","Equal Lows","OB Mitigation","Custom"];
const SESSIONS = ["Asian","London","New York","Indian","London-NY Overlap"];
const EMOTIONS = ["Confident","Neutral","Fearful","Greedy","FOMO","Revenge","Disciplined"];
const ACCT_TYPES = ["Funded","Personal","Demo","Prop Firm"];
const CURRENCIES = ["USD","INR","EUR","GBP"];

const SAMPLE_ACCOUNTS = [
  { id:"a1", name:"FTMO $100K",      type:"Funded",    broker:"FTMO",    currency:"USD", size:100000, maxDailyLoss:5,  maxTotalLoss:10, targetProfit:10, color:ACCT_COLORS[0], createdAt:"2026-05-01", status:"Active" },
  { id:"a2", name:"Zerodha Personal",type:"Personal",  broker:"Zerodha", currency:"INR", size:500000, maxDailyLoss:3,  maxTotalLoss:20, targetProfit:0,  color:ACCT_COLORS[1], createdAt:"2026-04-01", status:"Active" },
  { id:"a3", name:"MyForexFunds",    type:"Prop Firm", broker:"MFF",     currency:"USD", size:50000,  maxDailyLoss:5,  maxTotalLoss:12, targetProfit:8,  color:ACCT_COLORS[2], createdAt:"2026-06-01", status:"Active" },
];
const SAMPLE_TRADES = [
  { id:"t1", accountId:"a1", date:"2026-06-10", exitDate:"2026-06-10", market:"FX",     symbol:"XAUUSD",    direction:"Short", setup:"CHoCH + OB",     entry:3285.5, stopLoss:3295,  takeProfit:3260,  exitPrice:3261,   size:0.5, riskAmount:475,  pnl:1225,  rr:2.58, plannedRR:2.6,  status:"Closed", outcome:"Win",  session:"London",   notes:"Clean CHoCH",  tags:["SMC","OB"], emotion:"Confident", followedPlan:true, mistakes:"" },
  { id:"t2", accountId:"a1", date:"2026-06-09", exitDate:"2026-06-09", market:"FX",     symbol:"EURUSD",    direction:"Long",  setup:"BOS + FVG",      entry:1.0875, stopLoss:1.085, takeProfit:1.0945,exitPrice:1.0852, size:0.3, riskAmount:300,  pnl:-270,  rr:-0.9, plannedRR:2.8,  status:"Closed", outcome:"Loss", session:"New York", notes:"FVG reversed", tags:["FVG"],       emotion:"FOMO",      followedPlan:false, mistakes:"Entered early" },
  { id:"t3", accountId:"a2", date:"2026-06-08", exitDate:"2026-06-08", market:"Indian", symbol:"NIFTY",     direction:"Long",  setup:"Demand Zone",    entry:24850,  stopLoss:24780, takeProfit:25050, exitPrice:25045,  size:1,   riskAmount:3500, pnl:9750,  rr:2.79, plannedRR:2.86, status:"Closed", outcome:"Win",  session:"Indian",   notes:"Demand bounce", tags:["Demand"],    emotion:"Confident", followedPlan:true, mistakes:"" },
  { id:"t4", accountId:"a2", date:"2026-06-07", exitDate:"2026-06-07", market:"Indian", symbol:"BANKNIFTY", direction:"Short", setup:"Supply Zone",    entry:53200,  stopLoss:53350, takeProfit:52750, exitPrice:53205,  size:1,   riskAmount:3750, pnl:-125,  rr:-0.03,plannedRR:3.0,  status:"Closed", outcome:"BE",   session:"Indian",   notes:"SL to BE",      tags:["Supply"],    emotion:"Neutral",   followedPlan:true, mistakes:"Moved SL too soon" },
  { id:"t5", accountId:"a1", date:"2026-06-06", exitDate:"2026-06-06", market:"FX",     symbol:"XAUUSD",    direction:"Long",  setup:"Strong Low + OB",entry:3245,   stopLoss:3235,  takeProfit:3280,  exitPrice:3279.5, size:0.4, riskAmount:400,  pnl:1380,  rr:3.45, plannedRR:3.5,  status:"Closed", outcome:"Win",  session:"London",   notes:"Strong hold",   tags:["SMC","OB"],  emotion:"Confident", followedPlan:true, mistakes:"" },
  { id:"t6", accountId:"a2", date:"2026-06-05", exitDate:"2026-06-05", market:"Indian", symbol:"NIFTY",     direction:"Short", setup:"CHoCH + OB",     entry:25100,  stopLoss:25160, takeProfit:24940, exitPrice:24945,  size:1,   riskAmount:3000, pnl:7750,  rr:2.58, plannedRR:2.6,  status:"Closed", outcome:"Win",  session:"Indian",   notes:"CHoCH 15m",     tags:["SMC"],       emotion:"Confident", followedPlan:true, mistakes:"" },
  { id:"t7", accountId:"a3", date:"2026-06-04", exitDate:"2026-06-04", market:"FX",     symbol:"GBPUSD",    direction:"Long",  setup:"BOS + FVG",      entry:1.274,  stopLoss:1.272, takeProfit:1.28,  exitPrice:1.2725, size:0.2, riskAmount:200,  pnl:-300,  rr:-1.5, plannedRR:3.0,  status:"Closed", outcome:"Loss", session:"London",   notes:"HTF bearish",   tags:["FVG"],       emotion:"FOMO",      followedPlan:false, mistakes:"Ignored HTF" },
  { id:"t8", accountId:"a3", date:"2026-06-03", exitDate:"2026-06-03", market:"FX",     symbol:"XAUUSD",    direction:"Long",  setup:"Demand Zone",    entry:3220,   stopLoss:3210,  takeProfit:3260,  exitPrice:3258,   size:0.3, riskAmount:300,  pnl:1140,  rr:3.8, plannedRR:4.0,  status:"Closed", outcome:"Win",  session:"London",   notes:"Demand zone",   tags:["Demand"],    emotion:"Confident", followedPlan:true, mistakes:"" },
];

const emptyAccount = () => ({ name:"", type:"Funded", broker:"", currency:"USD", size:"", maxDailyLoss:"5", maxTotalLoss:"10", targetProfit:"10", color:ACCT_COLORS[Math.floor(Math.random()*ACCT_COLORS.length)], createdAt:new Date().toISOString().split("T")[0], status:"Active" });
const emptyTrade = (aid) => ({ accountId:aid||"", date:new Date().toISOString().split("T")[0], exitDate:"", market:"FX", symbol:"XAUUSD", direction:"Short", setup:"CHoCH + OB", entry:"", stopLoss:"", takeProfit:"", exitPrice:"", size:"", riskAmount:"", pnl:"", plannedRR:"", status:"Closed", outcome:"Win", session:"London", notes:"", tags:"", emotion:"Confident", followedPlan:true, mistakes:"" });

function getStats(trades, account) {
  const cl = trades.filter(t => t.status==="Closed");
  const wins = cl.filter(t => t.outcome==="Win");
  const loss = cl.filter(t => t.outcome==="Loss");
  const totalPnL = cl.reduce((s,t) => s+(t.pnl||0), 0);
  const balance = (account?.size||0) + totalPnL;
  const dd = account?.size ? Math.max(0, -Math.min(0, ...cl.map(t => t.pnl||0), 0)) : 0;
  const ddPct = account?.size ? (dd/account.size)*100 : 0;
  const profPct = account?.size ? (totalPnL/account.size)*100 : 0;
  return { cl, wins, loss, totalPnL, balance, dd, ddPct, profPct, winRate: cl.length?(wins.length/cl.length)*100:0, avgWin: wins.length?wins.reduce((s,t)=>s+t.pnl,0)/wins.length:0, avgLoss: loss.length?Math.abs(loss.reduce((s,t)=>s+t.pnl,0)/loss.length):0, pf: loss.length&&wins.length?(wins.reduce((s,t)=>s+t.pnl,0))/(Math.abs(loss.reduce((s,t)=>s+t.pnl,0))):0 };
}

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [trades, setTrades] = useState([]);
  const [activeAcct, setActiveAcct] = useState("all");
  const [view, setView] = useState("dashboard");
  const [showTModal, setShowTModal] = useState(false);
  const [showAModal, setShowAModal] = useState(false);
  const [editTradeId, setEditTradeId] = useState(null);
  const [editAcctId, setEditAcctId] = useState(null);
  const [tForm, setTForm] = useState(emptyTrade());
  const [aForm, setAForm] = useState(emptyAccount());
  const [filter, setFilter] = useState({ market:"All", outcome:"All", search:"" });
  const [sortKey, setSortKey] = useState({ k:"date", d:-1 });
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acctDrop, setAcctDrop] = useState(false);

  useEffect(() => {
    Promise.all([load(AK), load(TK)]).then(([a,t]) => {
      setAccounts(a || SAMPLE_ACCOUNTS);
      setTrades(t || SAMPLE_TRADES);
      if (!a) save(AK, SAMPLE_ACCOUNTS);
      if (!t) save(TK, SAMPLE_TRADES);
      setLoading(false);
    });
  }, []);

  const persistA = (a) => { setAccounts(a); save(AK, a); };
  const persistT = (t) => { setTrades(t); save(TK, t); };

  const openAddAcct = () => { setAForm(emptyAccount()); setEditAcctId(null); setShowAModal(true); };
  const openEditAcct = (a) => { setAForm({...a, size:String(a.size), maxDailyLoss:String(a.maxDailyLoss), maxTotalLoss:String(a.maxTotalLoss), targetProfit:String(a.targetProfit)}); setEditAcctId(a.id); setShowAModal(true); };
  const deleteAcct = (id) => { persistA(accounts.filter(a=>a.id!==id)); persistT(trades.filter(t=>t.accountId!==id)); if(activeAcct===id) setActiveAcct("all"); };
  const saveAcct = () => {
    const f = {...aForm, size:parseFloat(aForm.size)||0, maxDailyLoss:parseFloat(aForm.maxDailyLoss)||0, maxTotalLoss:parseFloat(aForm.maxTotalLoss)||0, targetProfit:parseFloat(aForm.targetProfit)||0};
    const next = editAcctId ? accounts.map(a=>a.id===editAcctId?{...f,id:editAcctId}:a) : [{...f,id:Date.now().toString()},...accounts];
    persistA(next);
    setShowAModal(false);
  };

  const openAddTrade = () => { setTForm(emptyTrade(activeAcct==="all"?(accounts[0]?.id||""):activeAcct)); setEditTradeId(null); setShowTModal(true); };
  const openEditTrade = (t) => { setTForm({...t, tags:Array.isArray(t.tags)?t.tags.join(", "):(t.tags||"")}); setEditTradeId(t.id); setShowTModal(true); };
  const deleteTrade = (id) => persistT(trades.filter(t=>t.id!==id));
  const saveTrade = () => {
    const f = {...tForm};
    f.entry = parseFloat(f.entry)||0;
    f.stopLoss = parseFloat(f.stopLoss)||0;
    f.takeProfit = parseFloat(f.takeProfit)||null;
    f.exitPrice = parseFloat(f.exitPrice)||null;
    f.size = parseFloat(f.size)||0;
    f.riskAmount = parseFloat(f.riskAmount)||0;
    f.pnl = parseFloat(f.pnl)||0;
    f.plannedRR = parseFloat(f.plannedRR)||0;
    f.tags = typeof f.tags==="string"?f.tags.split(",").map(x=>x.trim()).filter(Boolean):(f.tags||[]);
    if(f.entry&&f.stopLoss&&f.exitPrice) {
      const sign = f.direction==="Long"?1:-1;
      f.rr = parseFloat(((f.exitPrice-f.entry)/Math.abs(f.entry-f.stopLoss)*sign).toFixed(2));
    } else f.rr = f.plannedRR;
    const next = editTradeId?trades.map(t=>t.id===editTradeId?{...f,id:editTradeId}:t):[{...f,id:Date.now().toString()},...trades];
    persistT(next);
    setShowTModal(false);
  };

  const scopedTrades = useMemo(() => activeAcct==="all"?trades:trades.filter(t=>t.accountId===activeAcct), [trades, activeAcct]);
  const activeAccount = useMemo(() => accounts.find(a=>a.id===activeAcct)||null, [accounts, activeAcct]);

  const stats = useMemo(() => {
    const cl = scopedTrades.filter(t=>t.status==="Closed");
    const sorted = [...cl].sort((a,b)=>a.date.localeCompare(b.date));
    let run = 0;
    const equity = sorted.map(t => { run += t.pnl||0; return {date:t.date.slice(5), v:run}; });
    const dailyMap = {};
    cl.forEach(t => { dailyMap[t.date] = (dailyMap[t.date]||0)+(t.pnl||0); });
    const dailyArr = Object.entries(dailyMap).sort(([a],[b])=>a.localeCompare(b)).map(([d,v])=>({date:d.slice(5),v}));
    let jrun = activeAccount?.size||0;
    const journey = sorted.map(t => { jrun += t.pnl||0; return {date:t.date, bal:jrun}; });
    return {...getStats(cl, activeAccount), equity, dailyArr, journey, cl};
  }, [scopedTrades, activeAccount]);

  const filtered = useMemo(() => {
    let f = [...scopedTrades];
    if(filter.market!=="All") f = f.filter(t=>t.market===filter.market);
    if(filter.outcome!=="All") f = f.filter(t=>t.outcome===filter.outcome);
    if(filter.search) { const q = filter.search.toLowerCase(); f = f.filter(t=>(t.symbol||"").toLowerCase().includes(q)||(t.setup||"").toLowerCase().includes(q)||(t.notes||"").toLowerCase().includes(q)); }
    f.sort((a,b) => { const av=a[sortKey.k],bv=b[sortKey.k]; return typeof av==="string"?av.localeCompare(bv)*sortKey.d:((av||0)-(bv||0))*sortKey.d; });
    return f;
  }, [scopedTrades, filter, sortKey]);

  if(loading) return <div style={{background:C.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{fontSize:36,marginBottom:10}}>📊</div><div style={{color:C.gold,fontSize:14,fontWeight:600}}>Loading journal…</div></div></div>;

  const sym = activeAccount ? ({USD:"$",INR:"₹",EUR:"€",GBP:"£"}[activeAccount.currency]||"$") : "$";

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Inter',system-ui,sans-serif",display:"flex",fontSize:14}}>
      <nav style={{width:62,background:"#090E1A",borderRight:"1px solid "+C.border,display:"flex",flexDirection:"column",alignItems:"center",padding:"18px 0 14px",gap:6,position:"sticky",top:0,height:"100vh",flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:9,background:"linear-gradient(135deg,"+C.gold+",#D4820A)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#000",marginBottom:14}}>₹</div>
        {[{id:"dashboard",Icon:Home,label:"Dashboard"},{id:"accounts",Icon:Wallet,label:"Accounts"},{id:"trades",Icon:BookOpen,label:"Log"},{id:"analytics",Icon:BarChart2,label:"Analytics"},{id:"journey",Icon:TrendingUp,label:"Journey"}].map(({id,Icon,label})=>(
          <button key={id} title={label} onClick={()=>setView(id)} style={{width:44,height:44,borderRadius:10,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:view===id?rgba(C.gold,0.15):"transparent",color:view===id?C.gold:C.muted,transition:"all 0.15s"}}>
            <Icon size={20}/>
          </button>
        ))}
        <div style={{flex:1}}/>
        <button title="Log Trade" onClick={openAddTrade} style={{width:40,height:40,borderRadius:10,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,"+C.gold+",#D4820A)",color:"#000"}}>
          <Plus size={18} strokeWidth={2.5}/>
        </button>
      </nav>

      <div style={{flex:1,overflowY:"auto",padding:"24px 26px 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.5px"}}>{{dashboard:"Dashboard",accounts:"Accounts",trades:"Trade Log",analytics:"Analytics",journey:"Trading Journey"}[view]}</div>
            <div style={{color:C.muted,fontSize:12,marginTop:2}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{position:"relative"}}>
              <button onClick={()=>setAcctDrop(d=>!d)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:C.card,border:"1px solid "+C.border,borderRadius:9,color:C.text,cursor:"pointer",fontSize:13,fontWeight:600}}>
                {activeAccount?(<><div style={{width:8,height:8,borderRadius:"50%",background:activeAccount.color,flexShrink:0}}/>{activeAccount.name}</>):(<><div style={{width:8,height:8,borderRadius:"50%",background:C.gold,flexShrink:0}}/>All Accounts</>)}
                <ChevronDown size={14} color={C.muted}/>
              </button>
              {acctDrop&&(
                <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:C.card,border:"1px solid "+C.border,borderRadius:10,zIndex:99,minWidth:220,padding:6,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                  <button onClick={()=>{setActiveAcct("all");setAcctDrop(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:activeAcct==="all"?rgba(C.gold,0.12):"transparent",border:"none",cursor:"pointer",borderRadius:6,textAlign:"left"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:C.gold,flexShrink:0}}/>
                    <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>All Accounts</div><div style={{fontSize:11,color:C.muted}}>{trades.length} trades</div></div>
                  </button>
                  {accounts.map(a=>{
                    const s = getStats(trades.filter(t=>t.accountId===a.id), a);
                    return (
                      <button key={a.id} onClick={()=>{setActiveAcct(a.id);setAcctDrop(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:activeAcct===a.id?rgba(a.color,0.12):"transparent",border:"none",cursor:"pointer",borderRadius:6,textAlign:"left"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:a.color,flexShrink:0}}/>
                        <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.name}</div><div style={{fontSize:11,color:C.muted}}>{a.type} · {s.cl.length} trades · {s.totalPnL>0?"+":""}${s.totalPnL.toLocaleString("en-US",{maximumFractionDigits:0})}</div></div>
                      </button>
                    );
                  })}
                  <div style={{borderTop:"1px solid "+C.border,marginTop:4,paddingTop:4}}>
                    <button onClick={()=>{openAddAcct();setAcctDrop(false);}} style={{width:"100%",padding:"7px 10px",background:"transparent",border:"none",color:C.gold,cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6,borderRadius:6}}>
                      <Plus size={12}/> Add Account
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={openAddTrade} style={{background:"linear-gradient(135deg,"+C.gold+",#D4820A)",color:"#000",border:"none",borderRadius:9,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <Plus size={15} strokeWidth={2.5}/> Log Trade
            </button>
          </div>
        </div>

        {activeAccount&&(
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:rgba(activeAccount.color,0.08),border:"1px solid "+rgba(activeAccount.color,0.25),borderRadius:10,marginBottom:20,flexWrap:"wrap"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:activeAccount.color,flexShrink:0}}/>
            <span style={{fontWeight:700,color:activeAccount.color}}>{activeAccount.name}</span>
            <span style={{color:C.muted}}>·</span>
            <span style={{color:C.muted,fontSize:12}}>{activeAccount.type}</span>
            <span style={{color:C.muted}}>·</span>
            <span style={{fontSize:12}}>Size: <b>{sym}{activeAccount.size.toLocaleString()}</b></span>
            {activeAccount.maxDailyLoss>0&&<><span style={{color:C.muted}}>·</span><span style={{fontSize:12}}>Max Daily: <b style={{color:C.loss}}>{activeAccount.maxDailyLoss}%</b></span></>}
            {activeAccount.targetProfit>0&&<><span style={{color:C.muted}}>·</span><span style={{fontSize:12}}>Target: <b style={{color:C.win}}>{activeAccount.targetProfit}%</b></span></>}
            <div style={{flex:1}}/>
            <button onClick={()=>openEditAcct(activeAccount)} style={{background:"transparent",border:"1px solid"+C.border,borderRadius:6,color:C.muted,padding:"3px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>Edit</button>
          </div>
        )}

        {view==="dashboard"&&<Dashboard stats={stats} trades={scopedTrades} onDetail={setDetail} account={activeAccount} sym={sym}/>}
        {view==="accounts"&&<AccountsView accounts={accounts} trades={trades} onAdd={openAddAcct} onEdit={openEditAcct} onDelete={deleteAcct} onSelect={id=>{setActiveAcct(id);setView("dashboard");}}/>}
        {view==="trades"&&<TradeLog trades={filtered} accounts={accounts} filter={filter} setFilter={setFilter} sortKey={sortKey} setSortKey={setSortKey} onEdit={openEditTrade} onDelete={deleteTrade} onDetail={setDetail}/>}
        {view==="analytics"&&<Analytics stats={stats} sym={sym}/>}
        {view==="journey"&&<Journey account={activeAccount} trades={scopedTrades} sym={sym}/>}
      </div>

      {showTModal&&<TradeModal form={tForm} setForm={setTForm} accounts={accounts} onSave={saveTrade} onClose={()=>setShowTModal(false)} isEdit={!!editTradeId}/>}
      {showAModal&&<AccountModal form={aForm} setForm={setAForm} onSave={saveAcct} onClose={()=>setShowAModal(false)} isEdit={!!editAcctId}/>}
      {detail&&<Drawer trade={detail} accounts={accounts} onClose={()=>setDetail(null)} onEdit={t=>{openEditTrade(t);setDetail(null);}} onDelete={id=>{deleteTrade(id);setDetail(null);}}/>}
      {acctDrop&&<div style={{position:"fixed",inset:0,zIndex:90}} onClick={()=>setAcctDrop(false)}/>}
    </div>
  );
}

function Dashboard({stats, trades, onDetail, account, sym}) {
  const {cl, wins, loss, be, totalPnL, balance, winRate, pf, equity, dailyArr, journey, best, worst} = stats;
  const pc = totalPnL>=0?C.win:C.loss;
  const recent = [...trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const pieD = [{n:"Win",v:wins.length,c:C.win},{n:"Loss",v:loss.length,c:C.loss},{n:"BE",v:be.length,c:C.be}].filter(d=>d.v>0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
        <KPI big label="Net P&L" value={(totalPnL>=0?"+":"-")+sym+Math.abs(totalPnL).toLocaleString("en-US",{maximumFractionDigits:0})} color={pc} sub={cl.length+" closed trades"}/>
        <KPI label="Account Balance" value={sym+balance.toLocaleString("en-US",{maximumFractionDigits:0})} color={C.blue} sub={account?`From ${sym}${account.size.toLocaleString()}`:""}/> 
        <KPI label="Win Rate" value={winRate.toFixed(1)+"%"} color={winRate>=55?C.win:winRate>=45?C.be:C.loss} sub={wins.length+"W · "+loss.length+"L · "+be.length+"BE"}/>
        <KPI label="Profit Factor" value={pf.toFixed(2)+"×"} color={pf>=1.5?C.win:pf>=1?C.be:C.loss} sub="Avg win / avg loss ratio"/>
      </div>

      {account&&account.targetProfit>0&&(
        <Box pad={16}>
          <Lbl>Funded Account Progress</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:C.surface,borderRadius:10,padding:"12px 14px"}}>
              <div style={{color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:6}}>Profit Target ({account.targetProfit}%)</div>
              <div style={{fontSize:16,fontWeight:800,color:C.win,marginBottom:8}}>{stats.profPct.toFixed(1)}%</div>
              <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:Math.min(100,stats.profPct/account.targetProfit*100)+"%",background:C.win,borderRadius:3,transition:"width 0.5s"}}/>
              </div>
            </div>
            <div style={{background:C.surface,borderRadius:10,padding:"12px 14px"}}>
              <div style={{color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:6}}>Max Drawdown ({account.maxTotalLoss}%)</div>
              <div style={{fontSize:16,fontWeight:800,color:stats.ddPct>account.maxTotalLoss?C.loss:stats.ddPct>account.maxTotalLoss*0.75?C.be:C.win,marginBottom:8}}>{stats.ddPct.toFixed(1)}%</div>
              <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:Math.min(100,stats.ddPct/account.maxTotalLoss*100)+"%",background:stats.ddPct>account.maxTotalLoss?C.loss:stats.ddPct>account.maxTotalLoss*0.75?C.be:C.win,borderRadius:3,transition:"width 0.5s"}}/>
              </div>
            </div>
          </div>
        </Box>
      )}

      <div style={{display:"grid",gridTemplateColumns:"5fr 2fr",gap:12}}>
        <Box pad={18}>
          <Lbl>Equity Curve</Lbl>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={equity} margin={{top:4,right:4,left:-18,bottom:0}}>
              <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={pc} stopOpacity={0.22}/><stop offset="95%" stopColor={pc} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2B3C"/>
              <XAxis dataKey="date" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:12}} formatter={v=>[sym+Number(v).toFixed(0),"Equity"]}/>
              <Area type="monotone" dataKey="v" stroke={pc} strokeWidth={2} fill="url(#eg)" dot={false} activeDot={{r:4,fill:pc}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        <Box pad={18}>
          <Lbl>Outcome Split</Lbl>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart><Pie data={pieD} dataKey="v" cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={4}>{pieD.map((d,i)=><Cell key={i} fill={d.c}/>)}</Pie><Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:12}}/></PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:6}}>{pieD.map(d=><div key={d.n} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><div style={{width:7,height:7,borderRadius:"50%",background:d.c}}/><span style={{color:C.mutedLt}}>{d.n}</span><span style={{color:C.text,fontWeight:700}}>{d.v}</span></div>)}</div>
        </Box>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Box pad={18}>
          <Lbl>Daily P&L</Lbl>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dailyArr} margin={{top:4,right:4,left:-18,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#1A2B3C" vertical={false}/><XAxis dataKey="date" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:12}} formatter={v=>[sym+Number(v).toFixed(0),"P&L"]}/><Bar dataKey="v" radius={[4,4,0,0]}>{dailyArr.map((d,i)=><Cell key={i} fill={d.v>=0?C.win:C.loss}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </Box>
        <Box pad={18}>
          <Lbl>Recent Trades</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {recent.map(t=>(
              <div key={t.id} onClick={()=>onDetail(t)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.surface,borderRadius:8,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="#1E3045";}} onMouseLeave={e=>{e.currentTarget.style.background=C.surface;}}>
                <div style={{width:22,height:22,borderRadius:5,background:t.direction==="Long"?rgba(C.win,0.15):rgba(C.loss,0.15),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {t.direction==="Long"?<TrendingUp size={11} color={C.win}/>:<TrendingDown size={11} color={C.loss}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700}}>{t.symbol}</div>
                  <div style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.date}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:t.pnl>0?C.win:t.pnl<0?C.loss:C.be}}>{t.pnl>0?"+":""}{sym}{Math.abs(t.pnl).toFixed(0)}</div>
                </div>
              </div>
            ))}
            {recent.length===0&&<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:12}}>No trades yet</div>}
          </div>
        </Box>
      </div>
    </div>
  );
}

function Journey({account, trades, sym}) {
  const cl = trades.filter(t=>t.status==="Closed").sort((a,b)=>a.date.localeCompare(b.date));
  let run = account?.size||0;
  const journey = cl.map((t,i)=>{run+=t.pnl||0; return {date:t.date,bal:run,trade:t.symbol,pnl:t.pnl,cumPnL:run-(account?.size||0)};});
  
  const stats = {
    startBal: account?.size||0,
    endBal: run,
    maxBal: Math.max(...journey.map(j=>j.bal),account?.size||0),
    minBal: Math.min(...journey.map(j=>j.bal),account?.size||0),
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
        <KPI label="Starting Balance" value={sym+(stats.startBal).toLocaleString("en-US",{maximumFractionDigits:0})} color={C.blue} sub="Initial account size"/>
        <KPI label="Current Balance" value={sym+(stats.endBal).toLocaleString("en-US",{maximumFractionDigits:0})} color={stats.endBal>stats.startBal?C.win:C.loss} sub={stats.endBal>stats.startBal?"+"+sym+(stats.endBal-stats.startBal).toLocaleString():"-"+sym+(stats.startBal-stats.endBal).toLocaleString()}/>
        <KPI label="Peak Balance" value={sym+(stats.maxBal).toLocaleString("en-US",{maximumFractionDigits:0})} color={C.win} sub="Highest account value"/>
        <KPI label="Lowest Balance" value={sym+(stats.minBal).toLocaleString("en-US",{maximumFractionDigits:0})} color={stats.minBal<stats.startBal?C.loss:C.be} sub="Lowest account value"/>
      </div>

      <Box pad={18}>
        <Lbl>Account Balance Journey</Lbl>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={journey} margin={{top:4,right:4,left:-18,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2B3C"/>
            <XAxis dataKey="date" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:C.card,border:"1px solid"+C.border,borderRadius:8,color:C.text,fontSize:12}} formatter={(v,n,p)=>{const o=p.payload;return [sym+Number(v).toFixed(0),`Trade: ${o.trade} | P&L: ${o.pnl>0?"+":""}`];}} labelStyle={{color:C.text}}/>
            <Line type="monotone" dataKey="bal" stroke={C.gold} strokeWidth={2.5} dot={{r:3,fill:C.gold}} activeDot={{r:5}}/>
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Box pad={18}>
        <Lbl>Trade-by-Trade Breakdown</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"500px",overflowY:"auto"}}>
          {journey.map((j,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",background:C.surface,borderRadius:8}}>
              <div style={{width:28,textAlign:"center",fontWeight:700,color:C.muted,fontSize:11}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:12}}>{j.trade}</div>
                <div style={{fontSize:11,color:C.muted}}>{j.date}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:j.pnl>0?C.win:j.pnl<0?C.loss:C.be}}>{j.pnl>0?"+":""}{sym}{Math.abs(j.pnl).toFixed(0)}</div>
                <div style={{fontSize:11,color:C.muted}}>Bal: {sym}{j.bal.toLocaleString("en-US",{maximumFractionDigits:0})}</div>
              </div>
            </div>
          ))}
        </div>
      </Box>
    </div>
  );
}

function AccountsView({accounts, trades, onAdd, onEdit, onDelete, onSelect}) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{color:C.muted,fontSize:13}}>{accounts.length} account{accounts.length!==1?"s":""} · {trades.length} total trades</div>
        <button onClick={onAdd} style={{background:"linear-gradient(135deg,"+C.gold+",#D4820A)",color:"#000",border:"none",borderRadius:9,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <Plus size={14}/> Add Account
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
        {accounts.map(a=>{
          const t = trades.filter(x=>x.accountId===a.id);
          const s = getStats(t, a);
          return (
            <div key={a.id} style={{background:C.card,border:"1px solid"+C.border,borderRadius:14,overflow:"hidden"}}>
              <div style={{height:4,background:"linear-gradient(90deg,"+a.color+","+rgba(a.color,0.4)+")"}}/>
              <div style={{padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:a.color}}/>
                      <div style={{fontSize:15,fontWeight:800}}>{a.name}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <span style={{background:rgba(a.color,0.12),color:a.color,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700}}>{a.type}</span>
                      <span style={{background:rgba(C.muted,0.12),color:C.muted,padding:"2px 8px",borderRadius:4,fontSize:11}}>{a.broker}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <IBtn onClick={()=>onEdit(a)} color={C.mutedLt}><Edit2 size={13}/></IBtn>
                    <IBtn onClick={()=>onDelete(a.id)} color={C.loss}><Trash2 size={13}/></IBtn>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                  <div style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{color:C.muted,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:4}}>Size</div>
                    <div style={{fontSize:14,fontWeight:800}}>{({USD:"$",INR:"₹",EUR:"€",GBP:"£"}[a.currency]||"$")}{a.size.toLocaleString()}</div>
                  </div>
                  <div style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{color:C.muted,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:4}}>Balance</div>
                    <div style={{fontSize:14,fontWeight:800}}>{({USD:"$",INR:"₹",EUR:"€",GBP:"£"}[a.currency]||"$")}{(s.balance||a.size).toLocaleString("en-US",{maximumFractionDigits:0})}</div>
                  </div>
                  <div style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{color:C.muted,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:4}}>P&L</div>
                    <div style={{fontSize:14,fontWeight:800,color:s.totalPnL>=0?C.win:C.loss}}>{s.totalPnL>=0?"+":"-"}${Math.abs(s.totalPnL||0).toLocaleString("en-US",{maximumFractionDigits:0})}</div>
                  </div>
                </div>

                <div style={{display:"flex",gap:16,marginBottom:14}}>
                  {[["Trades",t.length],["WR",s.winRate?s.winRate.toFixed(1)+"%":"—"],["PF",s.pf?s.pf.toFixed(2)+"×":"—"]].map(([l,v])=>(
                    <div key={l}><div style={{color:C.muted,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px"}}>{l}</div><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{v}</div></div>
                  ))}
                </div>

                {a.targetProfit>0&&(
                  <div style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:C.muted}}>Target ({a.targetProfit}%)</span><span style={{fontSize:11,color:C.win,fontWeight:600}}>{s.profPct.toFixed(1)}%</span></div>
                    <div style={{height:5,background:C.surface,borderRadius:3}}><div style={{height:"100%",width:Math.min(100,s.profPct/a.targetProfit*100)+"%",background:C.win,borderRadius:3}}/></div>
                  </div>
                )}
                {a.maxTotalLoss>0&&(
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:C.muted}}>Drawdown ({a.maxTotalLoss}%)</span><span style={{fontSize:11,color:s.ddPct>75?C.loss:s.ddPct>50?C.be:C.muted,fontWeight:600}}>{s.ddPct.toFixed(1)}%</span></div>
                    <div style={{height:5,background:C.surface,borderRadius:3}}><div style={{height:"100%",width:Math.min(100,s.ddPct/a.maxTotalLoss*100)+"%",background:s.ddPct>a.maxTotalLoss?C.loss:s.ddPct>a.maxTotalLoss*0.75?C.be:C.win,borderRadius:3}}/></div>
                  </div>
                )}

                <button onClick={()=>onSelect(a.id)} style={{width:"100%",padding:"8px 0",background:rgba(a.color,0.1),border:"1px solid"+rgba(a.color,0.25),borderRadius:8,color:a.color,cursor:"pointer",fontSize:13,fontWeight:700}}>
                  View Journal →
                </button>
              </div>
            </div>
          );
        })}
        {accounts.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:60,color:C.muted}}><div style={{fontSize:40,marginBottom:12}}>💼</div><div style={{fontSize:16,fontWeight:600,marginBottom:8}}>No accounts yet</div><div style={{fontSize:13}}>Add your first trading account to get started</div></div>}
      </div>
    </div>
  );
}

function TradeLog({trades, accounts, filter, setFilter, sortKey, setSortKey, onEdit, onDelete, onDetail}) {
  const toggle = (k) => setSortKey(s=>({k,d:s.k===k?-s.d:-1}));
  const TH = ({k, label}) => (<th onClick={()=>toggle(k)} style={{padding:"10px 12px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:11,letterSpacing:"0.5px",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap",userSelect:"none"}}>{label}{sortKey.k===k?(sortKey.d===-1?" ↓":" ↑"):""}</th>);
  const acctMap = {};
  accounts.forEach(a=>{acctMap[a.id]=a;});
  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:180}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,pointerEvents:"none"}}/>
          <input value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} placeholder="Search symbol, setup, notes…" style={{width:"100%",padding:"8px 8px 8px 30px",background:C.card,border:"1px solid"+C.border,borderRadius:8,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
        </div>
        {[["market",["All","FX","Indian","Crypto"]],["outcome",["All","Win","Loss","BE"]]].map(([k,opts])=>(
          <select key={k} value={filter[k]} onChange={e=>setFilter(f=>({...f,[k]:e.target.value}))} style={{padding:"8px 12px",background:C.card,border:"1px solid"+C.border,borderRadius:8,color:C.text,fontSize:13,outline:"none",cursor:"pointer"}}>
            {opts.map(o=><option key={o}>{o}</option>)}
          </select>
        ))}
      </div>
      <Box pad={0} overflow="hidden">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead style={{borderBottom:"1px solid"+C.border}}><tr><TH k="date" label="Date"/><TH k="symbol" label="Symbol"/><TH k="market" label="Mkt"/><TH k="direction" label="Dir"/><TH k="setup" label="Setup"/><TH k="entry" label="Entry"/><TH k="exitPrice" label="Exit"/><TH k="pnl" label="P&L"/><TH k="rr" label="R:R"/><TH k="outcome" label="Result"/><th style={{padding:"10px 12px",color:C.muted}}>Act.</th></tr></thead>
            <tbody>
              {trades.map((t,i)=>{
                const a = acctMap[t.accountId];
                return (
                  <tr key={t.id} style={{borderBottom:"1px solid"+C.border,background:i%2===0?"transparent":"rgba(22,32,46,0.35)",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(245,166,35,0.04)";}} onMouseLeave={e=>{e.currentTarget.style.background=i%2===0?"transparent":"rgba(22,32,46,0.35)";}} onClick={()=>onDetail(t)}>
                    <td style={{padding:"10px 12px",color:C.muted}}>{t.date}</td>
                    <td style={{padding:"10px 12px",fontWeight:700}}>{t.symbol}</td>
                    <td style={{padding:"10px 12px"}}><span style={{background:t.market==="FX"?rgba(C.blue,0.13):rgba(C.purple,0.13),color:t.market==="FX"?C.blue:C.purple,padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:700}}>{t.market}</span></td>
                    <td style={{padding:"10px 12px",color:t.direction==="Long"?C.win:C.loss,fontWeight:600}}>{t.direction==="Long"?"▲":"▼"}</td>
                    <td style={{padding:"10px 12px",color:C.mutedLt,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.setup}</td>
                    <td style={{padding:"10px 12px"}}>{t.entry}</td>
                    <td style={{padding:"10px 12px"}}>{t.exitPrice||"—"}</td>
                    <td style={{padding:"10px 12px",fontWeight:700,color:t.pnl>0?C.win:t.pnl<0?C.loss:C.be}}>{t.pnl>0?"+":""}${Math.abs(t.pnl).toFixed(0)}</td>
                    <td style={{padding:"10px 12px",color:t.rr>0?C.win:C.loss,fontWeight:600}}>{t.rr}R</td>
                    <td style={{padding:"10px 12px"}}><Bdg o={t.outcome}/></td>
                    <td style={{padding:"10px 12px"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",gap:4}}><IBtn onClick={()=>onEdit(t)} color={C.mutedLt}><Edit2 size={12}/></IBtn><IBtn onClick={()=>onDelete(t.id)} color={C.loss}><Trash2 size={12}/></IBtn></div></td>
                  </tr>
                );
              })}
              {trades.length===0&&<tr><td colSpan={11} style={{padding:48,textAlign:"center",color:C.muted}}>No trades found</td></tr>}
            </tbody>
          </table>
        </div>
      </Box>
    </div>
  );
}

function Analytics({stats, sym}) {
  const {cl, avgWin, avgLoss, winRate, adherence} = stats;
  const exp = ((winRate/100*avgWin)-((100-winRate)/100*avgLoss)).toFixed(0);
  const setupMap = {}, symMap = {};
  cl.forEach(t=>{
    if(!setupMap[t.setup]) setupMap[t.setup]={pnl:0,n:0}; setupMap[t.setup].pnl+=t.pnl||0; setupMap[t.setup].n++;
    if(!symMap[t.symbol]) symMap[t.symbol]={pnl:0,n:0}; symMap[t.symbol].pnl+=t.pnl||0; symMap[t.symbol].n++;
  });
  const setupData = Object.entries(setupMap).map(([s,d])=>({setup:s.length>16?s.slice(0,15)+"…":s,pnl:d.pnl,n:d.n})).sort((a,b)=>b.pnl-a.pnl);
  const symData = Object.entries(symMap).map(([s,d])=>({sym:s,pnl:d.pnl,n:d.n})).sort((a,b)=>b.pnl-a.pnl);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
        <KPI label="Avg Win" value={"+"+sym+avgWin.toFixed(0)} color={C.win} sub="Per winning trade"/>
        <KPI label="Avg Loss" value={"-"+sym+avgLoss.toFixed(0)} color={C.loss} sub="Per losing trade"/>
        <KPI label="Expectancy" value={sym+exp} color={C.blue} sub="Per trade average"/>
        <KPI label="Plan Adherence" value={adherence.toFixed(1)+"%"} color={adherence>=75?C.win:C.be} sub={cl.filter(t=>t.followedPlan).length+"/"+cl.length+" trades"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Box pad={18}>
          <Lbl>P&L by Setup</Lbl>
          <ResponsiveContainer width="100%" height={220}><BarChart data={setupData} layout="vertical" margin={{top:0,right:8,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#1A2B3C" horizontal={false}/><XAxis type="number" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/><YAxis dataKey="setup" type="category" tick={{fill:C.mutedLt,fontSize:11}} axisLine={false} tickLine={false} width={100}/><Tooltip contentStyle={{background:C.card,border:"1px solid"+C.border,borderRadius:8,color:C.text,fontSize:12}} formatter={v=>[sym+Number(v).toFixed(0),"P&L"]}/><Bar dataKey="pnl" radius={[0,4,4,0]}>{setupData.map((d,i)=><Cell key={i} fill={d.pnl>=0?C.win:C.loss}/>)}</Bar></BarChart></ResponsiveContainer>
        </Box>
        <Box pad={18}>
          <Lbl>Symbol Performance</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {symData.slice(0,8).map(d=>{
              const mx = Math.max(...symData.map(x=>Math.abs(x.pnl)),1);
              return (
                <div key={d.sym} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:60,fontSize:12,fontWeight:700,flexShrink:0}}>{d.sym}</div>
                  <div style={{flex:1,height:5,background:C.surface,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:(Math.abs(d.pnl)/mx*100)+"%",background:d.pnl>=0?C.win:C.loss,borderRadius:3}}/></div>
                  <div style={{width:50,textAlign:"right",fontSize:12,fontWeight:700,color:d.pnl>=0?C.win:C.loss,flexShrink:0}}>{d.pnl>=0?"+":""}${d.pnl.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        </Box>
      </div>
    </div>
  );
}

function TradeModal({form, setForm, accounts, onSave, onClose, isEdit}) {
  const s = (k,v) => setForm(f=>({...f,[k]:v}));
  const symbols = form.market==="FX"?FX_PAIRS:form.market==="Indian"?INDIA_SYM:CRYPTO_SYM;
  let calcRR = null;
  if(form.entry&&form.stopLoss&&form.exitPrice) {
    const sign = form.direction==="Long"?1:-1;
    calcRR = ((parseFloat(form.exitPrice)-parseFloat(form.entry))/Math.abs(parseFloat(form.entry)-parseFloat(form.stopLoss))*sign).toFixed(2);
  }
  const inS = {width:"100%",padding:"8px 10px",background:C.surface,border:"1px solid"+C.border,borderRadius:7,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(5px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,border:"1px solid"+C.border,borderRadius:16,width:700,maxHeight:"92vh",overflowY:"auto",padding:26}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><div style={{fontSize:17,fontWeight:800}}>{isEdit?"Edit Trade":"Log New Trade"}</div><button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={18}/></button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FR label="Account" span={2}><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{accounts.map(a=><button key={a.id} onClick={()=>s("accountId",a.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:7,border:"1px solid"+(form.accountId===a.id?a.color:C.border),background:form.accountId===a.id?rgba(a.color,0.15):"transparent",color:form.accountId===a.id?a.color:C.muted,cursor:"pointer",fontSize:12,fontWeight:700}}><div style={{width:7,height:7,borderRadius:"50%",background:a.color}}/>{a.name}</button>)}</div></FR>
          <FR label="Market"><BG options={MARKETS} value={form.market} color={C.gold} onChange={v=>{s("market",v);s("symbol",v==="FX"?FX_PAIRS[0]:v==="Indian"?INDIA_SYM[0]:CRYPTO_SYM[0]);}} /></FR>
          <FR label="Symbol"><SL options={symbols} value={form.symbol} onChange={v=>s("symbol",v)}/></FR>
          <FR label="Direction"><BG options={["Long","Short"]} value={form.direction} onChange={v=>s("direction",v)} colorFn={v=>v==="Long"?C.win:C.loss}/></FR>
          <FR label="Status"><BG options={["Open","Closed"]} value={form.status} onChange={v=>s("status",v)} color={C.blue}/></FR>
          <FR label="Entry Date"><IN type="date" value={form.date} onChange={v=>s("date",v)}/></FR>
          <FR label="Exit Date"><IN type="date" value={form.exitDate} onChange={v=>s("exitDate",v)}/></FR>
          <FR label="Setup"><SL options={SETUPS} value={form.setup} onChange={v=>s("setup",v)}/></FR>
          <FR label="Session"><SL options={SESSIONS} value={form.session} onChange={v=>s("session",v)}/></FR>
          <FR label="Entry Price"><IN type="number" value={form.entry} onChange={v=>s("entry",v)} placeholder="e.g. 3285.50"/></FR>
          <FR label="Stop Loss"><IN type="number" value={form.stopLoss} onChange={v=>s("stopLoss",v)} placeholder="e.g. 3295.00"/></FR>
          <FR label="Take Profit"><IN type="number" value={form.takeProfit} onChange={v=>s("takeProfit",v)} placeholder="e.g. 3260.00"/></FR>
          <FR label="Exit Price"><IN type="number" value={form.exitPrice} onChange={v=>s("exitPrice",v)} placeholder="e.g. 3261.00"/></FR>
          <FR label="Size"><IN type="number" value={form.size} onChange={v=>s("size",v)} placeholder="e.g. 0.5"/></FR>
          <FR label="Risk $"><IN type="number" value={form.riskAmount} onChange={v=>s("riskAmount",v)} placeholder="e.g. 475"/></FR>
          <FR label="P&L $"><IN type="number" value={form.pnl} onChange={v=>s("pnl",v)} placeholder="e.g. 1225"/></FR>
          <FR label="Planned R:R"><IN type="number" value={form.plannedRR} onChange={v=>s("plannedRR",v)} placeholder="e.g. 2.6"/></FR>
          <FR label="Outcome"><BG options={["Win","Loss","BE","Open"]} value={form.outcome} onChange={v=>s("outcome",v)} colorFn={v=>v==="Win"?C.win:v==="Loss"?C.loss:v==="BE"?C.be:C.blue}/></FR>
          <FR label="Mindset"><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{EMOTIONS.map(e=><button key={e} onClick={()=>s("emotion",e)} style={{padding:"4px 10px",borderRadius:20,border:"1px solid"+(form.emotion===e?C.blue:C.border),background:form.emotion===e?rgba(C.blue,0.15):"transparent",color:form.emotion===e?C.blue:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{e}</button>)}</div></FR>
          <FR label="Followed Plan?"><BG options={["Yes","No"]} value={form.followedPlan?"Yes":"No"} onChange={v=>s("followedPlan",v==="Yes")} colorFn={v=>v==="Yes"?C.win:C.loss}/></FR>
          <FR label="Tags" span={2}><IN value={typeof form.tags==="string"?form.tags:(form.tags||[]).join(", ")} onChange={v=>s("tags",v)} placeholder="e.g. SMC, OB, CHoCH"/></FR>
          <FR label="Notes" span={2}><textarea rows={3} value={form.notes} onChange={e=>s("notes",e.target.value)} placeholder="Thesis, confluences…" style={{...inS,resize:"vertical"}}/></FR>
        </div>
        {calcRR!==null&&<div style={{margin:"14px 0 0",padding:"10px 14px",background:C.surface,borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:8}}><Activity size={14} color={C.muted}/><span style={{color:C.muted}}>Calculated R:R</span><span style={{fontWeight:800,color:parseFloat(calcRR)>0?C.win:C.loss,fontSize:15}}>{calcRR}R</span></div>}
        <div style={{display:"flex",gap:10,marginTop:20}}><button onClick={onClose} style={{flex:1,padding:"10px 0",background:"transparent",border:"1px solid"+C.border,borderRadius:8,color:C.muted,cursor:"pointer",fontSize:14}}>Cancel</button><button onClick={onSave} style={{flex:2,padding:"10px 0",background:"linear-gradient(135deg,"+C.gold+",#D4820A)",border:"none",borderRadius:8,color:"#000",cursor:"pointer",fontSize:14,fontWeight:800}}>{isEdit?"Update":"Save"}</button></div>
      </div>
    </div>
  );
}

function AccountModal({form, setForm, onSave, onClose, isEdit}) {
  const s = (k,v) => setForm(f=>({...f,[k]:v}));
  const inS = {width:"100%",padding:"8px 10px",background:C.surface,border:"1px solid"+C.border,borderRadius:7,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(5px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,border:"1px solid"+C.border,borderRadius:16,width:520,maxHeight:"90vh",overflowY:"auto",padding:26}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><div style={{fontSize:17,fontWeight:800}}>{isEdit?"Edit Account":"Add New Account"}</div><button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={18}/></button></div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:8}}>Account Color</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{ACCT_COLORS.map(c=><button key={c} onClick={()=>s("color",c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:form.color===c?"3px solid white":"3px solid transparent",cursor:"pointer",outline:"none"}}/>)}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FR label="Account Name" span={2}><input value={form.name} onChange={e=>s("name",e.target.value)} placeholder='e.g. "FTMO $100K"' style={inS}/></FR>
          <FR label="Account Type"><BG options={ACCT_TYPES} value={form.type} onChange={v=>s("type",v)} color={C.gold}/></FR>
          <FR label="Broker"><input value={form.broker} onChange={e=>s("broker",e.target.value)} placeholder='e.g. "FTMO"' style={inS}/></FR>
          <FR label="Currency"><BG options={CURRENCIES} value={form.currency} onChange={v=>s("currency",v)} color={C.blue}/></FR>
          <FR label="Account Size"><input type="number" value={form.size} onChange={e=>s("size",e.target.value)} placeholder="e.g. 100000" style={inS}/></FR>
          <FR label="Max Daily Loss %"><input type="number" value={form.maxDailyLoss} onChange={e=>s("maxDailyLoss",e.target.value)} placeholder="e.g. 5" style={inS}/></FR>
          <FR label="Max Drawdown %"><input type="number" value={form.maxTotalLoss} onChange={e=>s("maxTotalLoss",e.target.value)} placeholder="e.g. 10" style={inS}/></FR>
          <FR label="Profit Target %"><input type="number" value={form.targetProfit} onChange={e=>s("targetProfit",e.target.value)} placeholder="e.g. 10" style={inS}/></FR>
        </div>
        {form.name&&<div style={{marginTop:14,padding:"10px 14px",background:rgba(form.color,0.1),border:"1px solid"+rgba(form.color,0.3),borderRadius:8,display:"flex",alignItems:"center",gap:10}}><div style={{width:10,height:10,borderRadius:"50%",background:form.color}}/><span style={{fontWeight:700,color:form.color}}>{form.name}</span><span style={{color:C.muted,fontSize:12}}>· {form.type}</span></div>}
        <div style={{display:"flex",gap:10,marginTop:20}}><button onClick={onClose} style={{flex:1,padding:"10px 0",background:"transparent",border:"1px solid"+C.border,borderRadius:8,color:C.muted,cursor:"pointer",fontSize:14}}>Cancel</button><button onClick={onSave} disabled={!form.name||!form.size} style={{flex:2,padding:"10px 0",background:form.name&&form.size?"linear-gradient(135deg,"+C.gold+",#D4820A)":"rgba(245,166,35,0.3)",border:"none",borderRadius:8,color:form.name&&form.size?"#000":C.muted,cursor:form.name&&form.size?"pointer":"not-allowed",fontSize:14,fontWeight:800}}>{isEdit?"Update":"Add"}</button></div>
      </div>
    </div>
  );
}

function Drawer({trade, accounts, onClose, onEdit, onDelete}) {
  const t = trade;
  const acct = accounts.find(a=>a.id===t.accountId);
  const pnlC = t.pnl>0?C.win:t.pnl<0?C.loss:C.be;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:150,display:"flex",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:380,background:C.card,borderLeft:"1px solid"+C.border,height:"100vh",overflowY:"auto",padding:24,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:20,fontWeight:800}}>{t.symbol}</div><button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={18}/></button></div>
        {acct&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:rgba(acct.color,0.1),border:"1px solid"+rgba(acct.color,0.25),borderRadius:8}}><div style={{width:8,height:8,borderRadius:"50%",background:acct.color}}/><span style={{fontWeight:700,color:acct.color,fontSize:13}}>{acct.name}</span></div>}
        <div style={{background:C.surface,borderRadius:12,padding:"16px 18px",textAlign:"center",border:"1px solid"+rgba(pnlC,0.2)}}><div style={{color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase",marginBottom:6}}>P&L</div><div style={{fontSize:32,fontWeight:900,color:pnlC}}>{t.pnl>0?"+":""}{t.pnl}</div><div style={{color:C.muted,fontSize:13,marginTop:4}}>{t.rr}R</div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["Date",t.date],["Market",t.market],["Direction",t.direction],["Setup",t.setup],["Entry",t.entry],["Stop Loss",t.stopLoss],["Take Profit",t.takeProfit||"—"],["Exit",t.exitPrice||"—"],["Size",t.size],["Risk",t.riskAmount],["Status",t.status],["Mindset",t.emotion]].map(([k,v])=>(
            <div key={k} style={{background:C.surface,borderRadius:8,padding:"9px 11px}}><div style={{color:C.muted,fontSize:10,fontWeight:600,textTransform:"uppercase"}}>{k}</div><div style={{color:C.text,fontSize:12,fontWeight:700,marginTop:4}}>{v}</div></div>
          ))}
        </div>
        {t.notes&&<div style={{background:C.surface,borderRadius:8,padding:"11px 13px"}}><div style={{color:C.muted,fontSize:10,fontWeight:600,textTransform:"uppercase",marginBottom:6}}>Notes</div><div style={{color:C.text,fontSize:13,lineHeight:1.6}}>{t.notes}</div></div>}
        {Array.isArray(t.tags)&&t.tags.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{t.tags.map(tag=><span key={tag} style={{background:rgba(C.blue,0.1),color:C.blue,padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600}}>#{tag}</span>)}</div>}
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:8}}><button onClick={()=>onEdit(t)} style={{flex:1,padding:"9px 0",background:"transparent",border:"1px solid"+C.border,borderRadius:8,color:C.text,cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Edit2 size={13}/>Edit</button><button onClick={()=>onDelete(t.id)} style={{flex:1,padding:"9px 0",background:rgba(C.loss,0.1),border:"1px solid"+rgba(C.loss,0.3),borderRadius:8,color:C.loss,cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Trash2 size={13}/>Delete</button></div>
      </div>
    </div>
  );
}

const Box = ({children, pad, overflow}) => <div style={{background:C.card,border:"1px solid"+C.border,borderRadius:12,padding:pad!==undefined?pad:0,overflow:overflow||"visible"}}>{children}</div>;
const Lbl = ({children}) => <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:12}}>{children}</div>;
const KPI = ({label, value, color, sub, big}) => <Box pad="16px 18px"><div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.6px",textTransform:"uppercase",marginBottom:6}}>{label}</div><div style={{fontSize:big?26:20,fontWeight:900,color,letterSpacing:"-0.5px",marginBottom:3}}>{value}</div><div style={{fontSize:11,color:C.muted}}>{sub}</div></Box>;
const Bdg = ({o}) => {
  const col = {Win:C.win,Loss:C.loss,BE:C.be,Open:C.blue}[o]||C.muted;
  const bg = {Win:rgba(C.win,0.12),Loss:rgba(C.loss,0.12),BE:rgba(C.be,0.12),Open:rgba(C.blue,0.12)}[o]||"transparent";
  return <span style={{background:bg,color:col,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700}}>{o}</span>;
};
const IBtn = ({children, onClick, color}) => <button onClick={onClick} style={{background:"transparent",border:"none",cursor:"pointer",color,padding:"3px 4px",borderRadius:5,display:"flex",alignItems:"center",lineHeight:1}}>{children}</button>;
const FR = ({label, children, span}) => <div style={{gridColumn:span===2?"1 / -1":undefined}}><div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:5}}>{label}</div>{children}</div>;
const IN = ({type, value, onChange, placeholder}) => <input type={type||"text"} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={{width:"100%",padding:"8px 10px",background:C.surface,border:"1px solid"+C.border,borderRadius:7,color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>;
const SL = ({options, value, onChange}) => <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"8px 10px",background:C.surface,border:"1px solid"+C.border,borderRadius:7,color:C.text,fontSize:13,outline:"none",cursor:"pointer",fontFamily:"inherit"}}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;
const BG = ({options, value, onChange, color, colorFn}) => <div style={{display:"flex",gap:5}}>{options.map(o=>{const ac=colorFn?colorFn(o):(color||C.gold);const on=value===o;return <button key={o} onClick={()=>onChange(o)} style={{flex:1,padding:"7px 4px",borderRadius:7,border:"1px solid"+(on?ac:C.border),background:on?rgba(ac,0.15):"transparent",color:on?ac:C.muted,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{o}</button>;})}</div>;
