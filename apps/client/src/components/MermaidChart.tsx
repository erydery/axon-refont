import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';
mermaid.initialize({startOnLoad:false,theme:'dark',securityLevel:'strict'});
export function MermaidChart({chart}:{chart:string}){const id=useId().replace(/:/g,'');const[svg,setSvg]=useState('');useEffect(()=>{let active=true;const render=async()=>{try{const result=await mermaid.render(`axon-${id}`,chart);if(active)setSvg(result.svg);}catch{if(active)setSvg('');}};void render();return()=>{active=false;};},[chart,id]);return svg?<div className="mermaid-wrap" dangerouslySetInnerHTML={{__html:svg}}/>:<pre className="chart-fallback">{chart}</pre>}
