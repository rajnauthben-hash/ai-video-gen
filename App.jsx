import { useState } from "react";

const HF_TOKEN = "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";

const STYLES = ["Cinematic","Realistic","Luxury Ad","Product Ad","Social Reel","Cartoon","Anime","Documentary"];
const RATIOS = ["16:9","9:16","1:1"];
const DURATIONS = ["5s","10s"];

function gid(){return Math.random().toString(36).slice(2,8);}

export default function App(){
  const [prompt,setPrompt] = useState("");
  const [style,setStyle] = useState("Cinematic");
  const [ratio,setRatio] = useState("16:9");
  const [duration,setDuration] = useState("5s");
  const [status,setStatus] = useState("");
  const [progress,setProgress] = useState(0);
  const [videoUrl,setVideoUrl] = useState(null);
  const [history,setHistory] = useState([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  async function generate(){
    if(!prompt.trim())return;
    setLoading(true);setError("");setVideoUrl(null);setProgress(0);
    setStatus("⏳ Sending to Hugging Face...");setProgress(10);
    try{
      const finalPrompt = `${prompt}, ${style} style, high quality`;
      setStatus("🎬 Generating video... this takes 2-5 minutes");setProgress(30);
      const res = await fetch("https://api-inference.huggingface.co/models/ali-vilab/text-to-video-ms-1.7b",{
        method:"POST",
        headers:{"Authorization":`Bearer ${HF_TOKEN}`,"Content-Type":"application/json"},
        body:JSON.stringify({inputs:finalPrompt})
      });
      setProgress(80);
      if(!res.ok){
        const txt = await res.text();
        throw new Error(`Error ${res.status}: ${txt.slice(0,200)}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);setProgress(100);setStatus("✅ Done!");
      setHistory(h=>[{id:gid(),prompt,style,ratio,duration,url},...h]);
    }catch(e){
      setError(e.message);setStatus("❌ Failed");
    }finally{setLoading(false);}
  }

  return (
    <div style={{background:"#07090f",minHeight:"100vh",color:"#dde2f0",fontFamily:"sans-serif",padding:20}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <h1 style={{color:"#e8a835",marginBottom:24,fontSize:24}}>🎬 AI Video Generator</h1>

        <div style={{background:"#121620",borderRadius:16,padding:20,marginBottom:16,border:"1px solid #1d2438"}}>
          <div style={{marginBottom:12,fontSize:12,color:"#7b8aaa",textTransform:"uppercase"}}>Prompt</div>
          <textarea
            value={prompt}
            onChange={e=>setPrompt(e.target.value)}
            placeholder="Describe your video… e.g. a cat walking through a forest"
            style={{width:"100%",background:"#0d1018",border:"1.5px solid #1d2438",borderRadius:10,color:"#dde2f0",padding:12,fontSize:14,resize:"none",minHeight:90,outline:"none",boxSizing:"border-box"}}
          />
        </div>

        <div style={{background:"#121620",borderRadius:16,padding:20,marginBottom:16,border:"1px solid #1d2438"}}>
          <div style={{marginBottom:12,fontSize:12,color:"#7b8aaa",textTransform:"uppercase"}}>Style</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {STYLES.map(s=><button key={s} onClick={()=>setStyle(s)} style={{padding:"6px 14px",borderRadius:99,border:`1.5px solid ${style===s?"#e8a835":"#1d2438"}`,background:style===s?"rgba(232,168,53,0.18)":"transparent",color:style===s?"#e8a835":"#7b8aaa",cursor:"pointer",fontSize:12,fontWeight:600}}>{s}</button>)}
          </div>
        </div>

        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <div style={{flex:1,background:"#121620",borderRadius:16,padding:16,border:"1px solid #1d2438"}}>
            <div style={{marginBottom:10,fontSize:12,color:"#7b8aaa",textTransform:"uppercase"}}>Ratio</div>
            <div style={{display:"flex",gap:6}}>
              {RATIOS.map(r=><button key={r} onClick={()=>setRatio(r)} style={{flex:1,padding:"6px 0",borderRadius:99,border:`1.5px solid ${ratio===r?"#e8a835":"#1d2438"}`,background:ratio===r?"rgba(232,168,53,0.18)":"transparent",color:ratio===r?"#e8a835":"#7b8aaa",cursor:"pointer",fontSize:11,fontWeight:600}}>{r}</button>)}
            </div>
          </div>
          <div style={{flex:1,background:"#121620",borderRadius:16,padding:16,border:"1px solid #1d2438"}}>
            <div style={{marginBottom:10,fontSize:12,color:"#7b8aaa",textTransform:"uppercase"}}>Duration</div>
            <div style={{display:"flex",gap:6}}>
              {DURATIONS.map(d=><button key={d} onClick={()=>setDuration(d)} style={{flex:1,padding:"6px 0",borderRadius:99,border:`1.5px solid ${duration===d?"#e8a835":"#1d2438"}`,background:duration===d?"rgba(232,168,53,0.18)":"transparent",color:duration===d?"#e8a835":"#7b8aaa",cursor:"pointer",fontSize:11,fontWeight:600}}>{d}</button>)}
            </div>
          </div>
        </div>

        <button onClick={generate} disabled={loading||!prompt.trim()} style={{width:"100%",padding:14,background:loading?"#404a66":"#e8a835",color:"#07090f",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",marginBottom:16}}>
          {loading?"Generating...":"⚡ Generate Video"}
        </button>

        {status&&<div style={{background:"#121620",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #1d2438"}}>
          <div style={{fontSize:13,marginBottom:8}}>{status}</div>
          <div style={{height:4,background:"#1d2438",borderRadius:99}}><div style={{height:"100%",width:`${progress}%`,background:"#e8a835",borderRadius:99,transition:"width 0.5s"}}/></div>
        </div>}

        {error&&<div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:12,padding:16,marginBottom:16,color:"#f87171",fontSize:13}}>{error}</div>}

        {videoUrl&&<div style={{background:"#121620",borderRadius:16,padding:16,marginBottom:16,border:"1px solid #e8a835"}}>
          <video src={videoUrl} controls style={{width:"100%",borderRadius:10,marginBottom:12}}/>
          <a href={videoUrl} download="video.mp4" style={{display:"block",textAlign:"center",background:"#e8a835",color:"#07090f",padding:12,borderRadius:10,fontWeight:700,textDecoration:"none"}}>⬇️ Download MP4</a>
        </div>}

        {history.length>0&&<div style={{background:"#121620",borderRadius:16,padding:16,border:"1px solid #1d2438"}}>
          <div style={{fontSize:12,color:"#7b8aaa",textTransform:"uppercase",marginBottom:12}}>History ({history.length})</div>
          {history.map(v=><div key={v.id} style={{borderBottom:"1px solid #1d2438",paddingBottom:10,marginBottom:10}}>
            <div style={{fontSize:13,marginBottom:4}}>{v.prompt.slice(0,60)}</div>
            <div style={{display:"flex",gap:6}}>
              <span style={{fontSize:10,background:"#1d2438",padding:"2px 8px",borderRadius:99,color:"#7b8aaa"}}>{v.style}</span>
              <span style={{fontSize:10,background:"#1d2438",padding:"2px 8px",borderRadius:99,color:"#7b8aaa"}}>{v.ratio}</span>
              <a href={v.url} download="video.mp4" style={{fontSize:10,background:"rgba(232,168,53,0.18)",padding:"2px 8px",borderRadius:99,color:"#e8a835",textDecoration:"none",marginLeft:"auto"}}>Download</a>
            </div>
          </div>)}
        </div>}
      </div>
    </div>
  );
}
