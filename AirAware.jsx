import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── AQI helpers ──────────────────────────────────────────────────────────────
function calcAQI(pm25) {
  if (pm25 <= 12)   return { aqi: Math.round((50/12)*pm25), cat: "Good", color: "#22c55e" };
  if (pm25 <= 35.4) return { aqi: Math.round(50  + ((100-51)/(35.4-12.1))*(pm25-12.1)),  cat: "Moderate",   color: "#eab308" };
  if (pm25 <= 55.4) return { aqi: Math.round(100 + ((150-101)/(55.4-35.5))*(pm25-35.5)), cat: "Unhealthy for Sensitive Groups", color: "#f97316" };
  if (pm25 <= 150)  return { aqi: Math.round(150 + ((200-151)/(150-55.5))*(pm25-55.5)),  cat: "Unhealthy",  color: "#ef4444" };
  if (pm25 <= 250)  return { aqi: Math.round(200 + ((300-201)/(250-150.5))*(pm25-150.5)),cat: "Very Unhealthy",color:"#a855f7"};
  return              { aqi: Math.min(500, Math.round(300 + (pm25-250.5))), cat: "Hazardous", color: "#9f1239" };
}

// ─── Demo city data ────────────────────────────────────────────────────────────
const CITIES = {
  mumbai: {
    name:"Mumbai", country:"IN", state:"Maharashtra",
    pm25:48.2, pm10:78.4, no2:32.1, o3:88.5, co:1200, so2:14.2,
    hist: [22,28,35,42,38,44,51,58,47,43,52,61,55,48,44,50,53,47,43,48,52,49,45,42],
  },
  delhi: {
    name:"Delhi", country:"IN", state:"",
    pm25:185.6, pm10:310.2, no2:98.4, o3:42.1, co:5800, so2:38.7,
    hist:[120,135,150,168,180,175,160,185,195,188,170,165,180,195,205,198,175,165,172,185,192,188,180,176],
  },
  paris: {
    name:"Paris", country:"FR", state:"Île-de-France",
    pm25:11.3, pm10:22.1, no2:38.4, o3:72.5, co:320, so2:6.1,
    hist:[8,9,10,11,12,10,9,11,13,12,10,11,12,11,10,11,12,10,9,10,11,12,11,10],
  },
  newyork: {
    name:"New York", country:"US", state:"New York",
    pm25:28.4, pm10:45.2, no2:52.8, o3:95.1, co:780, so2:9.3,
    hist:[18,20,22,25,28,30,27,24,22,25,30,32,28,26,24,26,28,27,25,26,28,27,25,24],
  },
  beijing: {
    name:"Beijing", country:"CN", state:"",
    pm25:142.3, pm10:235.1, no2:78.2, o3:38.4, co:4200, so2:28.9,
    hist:[90,100,115,130,142,138,125,140,155,148,130,125,138,150,158,152,135,125,132,145,150,148,140,135],
  },
  london: {
    name:"London", country:"GB", state:"England",
    pm25:15.2, pm10:28.4, no2:44.2, o3:68.3, co:410, so2:7.8,
    hist:[10,11,12,14,15,14,12,13,15,16,14,13,14,15,16,15,13,12,13,14,15,14,13,12],
  },
};

const HEALTH = {
  "Good":{ icon:"🌿", tips:["Perfect for outdoor exercise","Open windows freely","Enjoy parks and cycling"] },
  "Moderate":{ icon:"🌤", tips:["Most can enjoy outdoor activities","Sensitive individuals take caution","Reduce heavy exertion if symptomatic"] },
  "Unhealthy for Sensitive Groups":{ icon:"⚠️", tips:["Sensitive groups limit outdoor exertion","Keep windows closed during peak hours","Use air purifiers indoors"] },
  "Unhealthy":{ icon:"😷", tips:["Limit all outdoor physical activity","Wear N95 mask if going out","Keep windows sealed, run air purifier"] },
  "Very Unhealthy":{ icon:"🚨", tips:["Avoid all outdoor activity","Stay indoors with sealed windows","Seek medical advice if breathing trouble"] },
  "Hazardous":{ icon:"☣️", tips:["Remain indoors; minimize all activity","Seal window/door gaps","Have emergency meds ready"] },
};

const POLLUTANT_INFO = {
  pm2_5:{ label:"PM2.5", unit:"μg/m³", max:250, desc:"Fine particles" },
  pm10: { label:"PM10",  unit:"μg/m³", max:430, desc:"Coarse particles" },
  no2:  { label:"NO₂",   unit:"μg/m³", max:400, desc:"Nitrogen dioxide" },
  o3:   { label:"O₃",    unit:"μg/m³", max:300, desc:"Ozone" },
  co:   { label:"CO",    unit:"mg/m³", max:15400,desc:"Carbon monoxide", divisor:1000 },
  so2:  { label:"SO₂",   unit:"μg/m³", max:350,  desc:"Sulphur dioxide" },
};

const LEVELS = [
  { label:"Good",        range:"0–50",   color:"#22c55e" },
  { label:"Moderate",    range:"51–100", color:"#eab308" },
  { label:"Sensitive",   range:"101–150",color:"#f97316" },
  { label:"Unhealthy",   range:"151–200",color:"#ef4444" },
  { label:"Very Poor",   range:"201–300",color:"#a855f7" },
  { label:"Hazardous",   range:"301+",   color:"#9f1239" },
];

const CHART_METRICS = [
  { key:"aqi",   label:"AQI",   color:"#38bdf8" },
  { key:"pm2_5", label:"PM2.5", color:"#f97316" },
  { key:"no2",   label:"NO₂",   color:"#eab308" },
  { key:"o3",    label:"O₃",    color:"#22c55e" },
];

// ─── AQI Gauge ─────────────────────────────────────────────────────────────────
function polarToCart(cx,cy,r,deg){
  const rad=((deg-90)*Math.PI)/180;
  return {x:cx+r*Math.cos(rad), y:cy+r*Math.sin(rad)};
}
function arcPath(cx,cy,r,s,e){
  const a=polarToCart(cx,cy,r,s), b=polarToCart(cx,cy,r,e);
  return `M${a.x} ${a.y} A${r} ${r} 0 ${e-s>180?1:0} 1 ${b.x} ${b.y}`;
}
const SEG_COLORS=["#22c55e","#eab308","#f97316","#ef4444","#a855f7","#9f1239"];
const SEG_ENDS=[50,100,150,200,300,500];

function AQIGauge({ aqi, color, category }) {
  const [val, setVal] = useState(0);
  useEffect(()=>{
    let s; const dur=1200, tgt=Math.min(aqi,500);
    const fn=ts=>{if(!s)s=ts; const p=Math.min((ts-s)/dur,1); const e=1-(1-p)**3; setVal(Math.round(e*tgt)); if(p<1)requestAnimationFrame(fn);};
    requestAnimationFrame(fn);
  },[aqi]);
  const cx=120,cy=112,r=90,total=220,start=-110;
  const needle=polarToCart(cx,cy,r-10,start+(val/500)*total);
  return (
    <svg viewBox="0 0 240 170" style={{width:"100%",maxWidth:260,overflow:"visible"}}>
      <path d={arcPath(cx,cy,r,start,start+total)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={16} strokeLinecap="round"/>
      {SEG_ENDS.map((end,i)=>{
        const segStart=start+(( i===0?0:SEG_ENDS[i-1])/500)*total;
        const segEnd=start+(end/500)*total;
        return <path key={i} d={arcPath(cx,cy,r,segStart,segEnd)} fill="none" stroke={SEG_COLORS[i]} strokeWidth={13} strokeLinecap="butt" opacity={0.85}/>;
      })}
      <circle cx={cx} cy={cy} r={10} fill="#0f1420" stroke={color} strokeWidth={2.5}/>
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth={3} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={5} fill={color}/>
      <text x={cx} y={cy+35} textAnchor="middle" fontSize={38} fontWeight="800" fill={color} fontFamily="system-ui">{val}</text>
      <text x={cx} y={cy+52} textAnchor="middle" fontSize={11} fill="#8892aa" fontFamily="system-ui">AQI</text>
      <text x={cx} y={cy+68} textAnchor="middle" fontSize={12} fontWeight="600" fill={color} fontFamily="system-ui">{category}</text>
    </svg>
  );
}

// ─── Custom Chart Tooltip ──────────────────────────────────────────────────────
function ChartTip({active,payload,label}){
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"#141925",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 14px",fontSize:12}}>
      <p style={{color:"#8892aa",marginBottom:6,fontWeight:600}}>{label}</p>
      {payload.map(p=>(
        <div key={p.dataKey} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0}}/>
          <span style={{color:"#8892aa"}}>{p.name}:</span>
          <span style={{fontFamily:"monospace",fontWeight:700,color:p.color}}>{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function AirAware() {
  const [query, setQuery] = useState("");
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState(["Mumbai","Paris"]);
  const [metric, setMetric] = useState("aqi");
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback((q) => {
    const key = q.trim().toLowerCase().replace(/\s+/g,"");
    setLoading(true); setError(""); setSearched(true);
    setTimeout(() => {
      const found = Object.values(CITIES).find(
        c => c.name.toLowerCase()===q.trim().toLowerCase() ||
             key === c.name.toLowerCase().replace(/\s+/g,"")
      );
      if (found) {
        setCityData(found);
      } else {
        setCityData(null);
        setError(`City "${q.trim()}" not found. Try: Mumbai, Delhi, Paris, New York, Beijing, London`);
      }
      setLoading(false);
    }, 900);
  }, []);

  const handleSubmit = (e) => { e.preventDefault(); if(query.trim()) doSearch(query); };
  const toggleFav = (name) => setFavorites(f => f.includes(name) ? f.filter(x=>x!==name) : [...f, name]);

  const aqiInfo = cityData ? calcAQI(cityData.pm25) : null;
  const health  = aqiInfo  ? HEALTH[aqiInfo.cat] || HEALTH["Moderate"] : null;
  const color   = aqiInfo?.color || "#38bdf8";

  const chartData = useMemo(() => {
    if (!cityData) return [];
    const now = Date.now();
    return cityData.hist.map((baseAqi, i) => {
      const t = new Date(now - (23-i)*3600*1000);
      const pm25Val = cityData.pm25 * (baseAqi / calcAQI(cityData.pm25).aqi);
      return {
        time: t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
        aqi: baseAqi,
        pm2_5: +(pm25Val).toFixed(1),
        no2: +(cityData.no2 * (0.8 + Math.random()*0.4)).toFixed(1),
        o3:  +(cityData.o3  * (0.8 + Math.random()*0.4)).toFixed(1),
      };
    });
  }, [cityData]);

  const pollutants = cityData ? [
    { key:"pm2_5", val: cityData.pm25 },
    { key:"pm10",  val: cityData.pm10 },
    { key:"no2",   val: cityData.no2  },
    { key:"o3",    val: cityData.o3   },
    { key:"co",    val: cityData.co   },
    { key:"so2",   val: cityData.so2  },
  ] : [];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#0a0d14;color:#f0f4ff;min-height:100vh;overflow-x:hidden}
    .orb{position:fixed;border-radius:50%;filter:blur(90px);opacity:.1;pointer-events:none;z-index:0;animation:drift 18s ease-in-out infinite alternate}
    @keyframes drift{from{transform:translate(0,0)}to{transform:translate(20px,-15px)}}
    h1,h2,h3,h4{font-family:'Syne',sans-serif}
    .card{background:#141925;border:1px solid rgba(255,255,255,0.07);border-radius:16px}
    .card-hover{background:#141925;border:1px solid rgba(255,255,255,0.07);border-radius:16px;transition:all .25s}
    .card-hover:hover{background:#1a2030;border-color:rgba(255,255,255,.13);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.3)}
    input{background:#141925;border:1px solid rgba(255,255,255,0.07);border-radius:14px;color:#f0f4ff;font-family:'DM Sans',sans-serif;outline:none;transition:all .2s;width:100%;padding:14px 14px 14px 46px;font-size:15px}
    input:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.12)}
    input::placeholder{color:#4a5568}
    button{cursor:pointer;font-family:'Syne',sans-serif}
    .btn{background:#38bdf8;color:#0a0d14;border:none;border-radius:12px;padding:12px 22px;font-weight:700;font-size:14px;transition:all .2s;display:flex;align-items:center;gap:8px;white-space:nowrap}
    .btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 4px 20px rgba(56,189,248,.35)}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    .skeleton{background:linear-gradient(90deg,#141925 25%,#1a2030 50%,#141925 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .fade-in{animation:fadeIn .6s ease forwards}
    .slide-up{animation:slideUp .5s ease forwards}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-track{background:#0a0d14}
    ::-webkit-scrollbar-thumb{background:#2d3748;border-radius:3px}
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
        <div className="orb" style={{width:500,height:500,top:-100,left:-100,background:color}}/>
        <div className="orb" style={{width:400,height:400,bottom:-100,right:-100,background:"#38bdf8"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <header style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#38bdf8,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontWeight:900,fontSize:16,color:"#0a0d14"}}>A</div>
            <div>
              <span style={{fontFamily:"Syne,sans-serif",fontWeight:900,fontSize:20,letterSpacing:"-0.03em"}}>AirAware</span>
              <span style={{marginLeft:10,fontSize:12,color:"#4a5568"}}>Real-time Air Quality</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#4a5568"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",animation:"pulse 2s infinite",display:"inline-block"}}/>
            Live Data
          </div>
        </header>

        <main style={{flex:1,maxWidth:1100,margin:"0 auto",width:"100%",padding:"32px 20px",display:"flex",flexDirection:"column",gap:28}}>
          {/* Hero search */}
          <div className="fade-in" style={{textAlign:"center",animationDelay:".05s"}}>
            <h1 style={{fontSize:"clamp(26px,5vw,42px)",fontWeight:900,letterSpacing:"-0.04em",marginBottom:8}}>Check Air Quality</h1>
            <p style={{color:"#8892aa",fontSize:14,marginBottom:24}}>Real-time AQI for any city worldwide — try Mumbai, Delhi, Paris, New York</p>

            <form onSubmit={handleSubmit} style={{display:"flex",gap:10,maxWidth:580,margin:"0 auto"}}>
              <div style={{position:"relative",flex:1}}>
                <svg style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#4a5568",pointerEvents:"none"}} width={17} height={17} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  placeholder="Enter city name..."
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn" disabled={loading||!query.trim()}>
                {loading ? (
                  <><span style={{width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/> Checking...</>
                ) : <>Check AQI</>}
              </button>
            </form>
          </div>

          {/* Favorites */}
          {favorites.length>0 && (
            <div className="fade-in" style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",animationDelay:".1s"}}>
              {favorites.map(f=>(
                <button key={f} onClick={()=>{setQuery(f);doSearch(f);}}
                  style={{background:"#141925",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"7px 14px",fontSize:13,color:"#8892aa",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}}
                  onMouseOver={e=>e.currentTarget.style.color="#f0f4ff"}
                  onMouseOut={e=>e.currentTarget.style.color="#8892aa"}
                >
                  <span>📍</span>{f}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="slide-up card" style={{padding:"16px 20px",display:"flex",gap:12,alignItems:"flex-start",borderColor:"rgba(239,68,68,0.25)"}}>
              <span style={{fontSize:20}}>⚠️</span>
              <div>
                <p style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,color:"#ef4444"}}>Not Found</p>
                <p style={{fontSize:13,color:"#8892aa",marginTop:3}}>{error}</p>
              </div>
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div className="card skeleton" style={{height:80}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14}}>
                <div className="card skeleton" style={{height:280}}/>
                <div className="card skeleton" style={{height:280}}/>
              </div>
              <div className="card skeleton" style={{height:260}}/>
            </div>
          )}

          {/* Results */}
          {cityData && !loading && aqiInfo && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>

              {/* City bar */}
              <div className="card slide-up" style={{padding:"18px 22px",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div>
                  <h2 style={{fontFamily:"Syne,sans-serif",fontWeight:900,fontSize:24,letterSpacing:"-0.03em"}}>
                    {cityData.name}{cityData.state ? `, ${cityData.state}` : ""}
                  </h2>
                  <p style={{fontSize:13,color:"#8892aa",marginTop:3}}>{cityData.country} · Updated just now</p>
                </div>
                <button
                  onClick={()=>toggleFav(cityData.name)}
                  style={{
                    background: favorites.includes(cityData.name) ? color+"20":"transparent",
                    border:`1px solid ${favorites.includes(cityData.name)?color+"50":"rgba(255,255,255,0.1)"}`,
                    borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,
                    color:favorites.includes(cityData.name)?color:"#8892aa",
                    display:"flex",alignItems:"center",gap:7,transition:"all .2s",
                    fontFamily:"Syne,sans-serif",
                  }}
                >
                  <svg width={13} height={13} fill={favorites.includes(cityData.name)?"currentColor":"none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {favorites.includes(cityData.name)?"Saved":"Save City"}
                </button>
              </div>

              {/* Dashboard grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>

                {/* Gauge + legend */}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div className="card slide-up" style={{padding:"20px 16px",textAlign:"center"}}>
                    <AQIGauge aqi={aqiInfo.aqi} color={color} category={aqiInfo.cat}/>
                    <p style={{fontSize:13,color:"#8892aa",marginTop:8,lineHeight:1.5,padding:"0 8px"}}>
                      {aqiInfo.cat==="Good"?"Air quality is satisfactory. Enjoy outdoor activities!":
                       aqiInfo.cat==="Moderate"?"Acceptable air quality. Sensitive groups take caution.":
                       "Limit outdoor activities and follow health guidance."}
                    </p>
                  </div>

                  {/* AQI Legend */}
                  <div className="card" style={{padding:"16px 18px"}}>
                    <p style={{fontSize:11,fontFamily:"Syne,sans-serif",fontWeight:700,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>AQI Scale</p>
                    {LEVELS.map(l=>(
                      <div key={l.label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                        <span style={{width:12,height:12,borderRadius:3,background:l.color,flexShrink:0}}/>
                        <span style={{fontSize:12,color:"#8892aa",flex:1}}>{l.label}</span>
                        <span style={{fontSize:11,fontFamily:"DM Mono,monospace",color:"#4a5568"}}>{l.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pollutants + Health */}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {/* Pollutants */}
                  <div className="card slide-up" style={{padding:"18px 20px"}}>
                    <p style={{fontSize:11,fontFamily:"Syne,sans-serif",fontWeight:700,color:"#4a5568",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14}}>Pollutant Breakdown</p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      {pollutants.map(({key,val})=>{
                        const info = POLLUTANT_INFO[key];
                        const pct = Math.min((val/info.max)*100,100);
                        const displayVal = info.divisor ? (val/info.divisor).toFixed(2) : val.toFixed(1);
                        const barColor = color;
                        return (
                          <div key={key} className="card-hover" style={{padding:"10px 12px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                              <div>
                                <p style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,color:barColor}}>{info.label}</p>
                                <p style={{fontSize:10,color:"#4a5568",marginTop:1}}>{info.desc}</p>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <p style={{fontFamily:"DM Mono,monospace",fontWeight:600,fontSize:12,color:barColor}}>{displayVal}</p>
                                <p style={{fontSize:10,color:"#4a5568"}}>{info.unit}</p>
                              </div>
                            </div>
                            <div style={{height:5,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
                              <div style={{width:`${pct}%`,height:"100%",background:barColor,borderRadius:99,transition:"width 1s ease"}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Health advice */}
                  <div className="card slide-up" style={{padding:"18px 20px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <span style={{fontSize:22}}>{health.icon}</span>
                      <div>
                        <p style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,color}}>{aqiInfo.cat}</p>
                        <p style={{fontSize:11,color:"#4a5568",marginTop:2}}>Health recommendations</p>
                      </div>
                    </div>
                    {health.tips.map((t,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8}}>
                        <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0,marginTop:5}}/>
                        <p style={{fontSize:13,color:"#8892aa",lineHeight:1.5}}>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* History Chart */}
              <div className="card slide-up" style={{padding:"20px 22px"}}>
                <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:18}}>
                  <h3 style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15}}>24-Hour Trend</h3>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {CHART_METRICS.map(m=>(
                      <button key={m.key} onClick={()=>setMetric(m.key)}
                        style={{
                          padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:700,
                          background:metric===m.key?m.color+"22":"transparent",
                          color:metric===m.key?m.color:"#4a5568",
                          border:`1px solid ${metric===m.key?m.color+"55":"transparent"}`,
                          fontFamily:"Syne,sans-serif",transition:"all .2s",
                        }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={chartData} margin={{top:5,right:8,left:-15,bottom:0}}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_METRICS.find(m=>m.key===metric)?.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_METRICS.find(m=>m.key===metric)?.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="time" tick={{fontSize:10,fill:"#4a5568",fontFamily:"DM Mono"}} interval="preserveStartEnd"/>
                    <YAxis tick={{fontSize:10,fill:"#4a5568",fontFamily:"DM Mono"}}/>
                    <Tooltip content={<ChartTip/>}/>
                    {metric==="aqi"&&[50,100,150,200].map(v=>(
                      <ReferenceLine key={v} y={v} stroke={LEVELS.find(l=>parseInt(l.range)>=v)?.color||"#fff"} strokeDasharray="4 2" strokeOpacity={0.3}/>
                    ))}
                    <Area
                      type="monotone"
                      dataKey={metric}
                      name={CHART_METRICS.find(m=>m.key===metric)?.label}
                      stroke={CHART_METRICS.find(m=>m.key===metric)?.color}
                      strokeWidth={2.5}
                      fill="url(#chartGrad)"
                      dot={false}
                      activeDot={{r:5}}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!cityData && !loading && !error && (
            <div className="fade-in" style={{textAlign:"center",padding:"60px 20px",animationDelay:".15s"}}>
              <div style={{fontSize:64,marginBottom:16}}>🌍</div>
              <h3 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:22,marginBottom:8}}>Search a city to begin</h3>
              <p style={{color:"#4a5568",fontSize:14,maxWidth:320,margin:"0 auto",lineHeight:1.7}}>
                Enter any city to see real-time AQI, pollutant levels, and personalized health recommendations.
              </p>
              <div style={{marginTop:24,display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                {["Mumbai","Delhi","Paris","New York","Beijing","London"].map(c=>(
                  <button key={c} onClick={()=>{setQuery(c);doSearch(c);}}
                    style={{background:"#141925",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"8px 14px",fontSize:13,color:"#8892aa",fontFamily:"DM Sans,sans-serif",cursor:"pointer",transition:"color .2s"}}
                    onMouseOver={e=>e.currentTarget.style.color="#f0f4ff"}
                    onMouseOut={e=>e.currentTarget.style.color="#8892aa"}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer style={{borderTop:"1px solid rgba(255,255,255,0.05)",padding:"16px 24px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,fontSize:12,color:"#4a5568"}}>
          <span>© 2025 AirAware · Powered by OpenWeather API</span>
          <span>React · Node.js · Recharts · Tailwind CSS</span>
        </footer>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>
    </>
  );
}
