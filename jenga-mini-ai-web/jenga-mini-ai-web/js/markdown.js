/* Small, deliberately limited Markdown renderer. All untrusted text goes through
   textContent/createTextNode; HTML and images are never executed or loaded. */
window.JengaMarkdown = (() => {
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  function inline(parent,text){
    const pattern=/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g;
    let last=0;
    for(const match of text.matchAll(pattern)){
      parent.append(document.createTextNode(text.slice(last,match.index)));const s=match[0];let n;
      if(s.startsWith('`'))n=el('code',s.slice(1,-1));
      else if(s.startsWith('**'))n=el('strong',s.slice(2,-2));
      else if(s.startsWith('*'))n=el('em',s.slice(1,-1));
      else {const parts=s.match(/^\[([^\]]+)\]\((.+)\)$/);n=el('a',parts[1]);n.href=parts[2];n.target='_blank';n.rel='noopener noreferrer';}
      parent.append(n);last=match.index+s.length;
    }
    parent.append(document.createTextNode(text.slice(last)));
  }
  function highlight(node,text,language){
    if(!/^(js|javascript|ts|typescript|java|c|cpp|csharp|cs|python|py|json)$/.test(language)){node.textContent=text;return;}
    const re=/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|#[^\n]*|\b(?:const|let|var|function|return|if|else|for|while|class|public|private|static|new|import|from|def|True|False|None|true|false|null|await|async|throw|try|catch|int|void|String)\b|\b\d+(?:\.\d+)?\b)/g;let last=0;
    for(const m of text.matchAll(re)){node.append(document.createTextNode(text.slice(last,m.index)));const t=m[0];const type=/^["'`]/.test(t)?'string':/^(\/\/|#)/.test(t)?'comment':/^\d/.test(t)?'number':'keyword';const span=el('span',t);span.className='token-'+type;node.append(span);last=m.index+t.length;}node.append(document.createTextNode(text.slice(last)));
  }
  function render(text){
    const root=document.createDocumentFragment(),lines=text.replace(/\r\n/g,'\n').split('\n');
    for(let i=0;i<lines.length;){
      const line=lines[i];
      if(line.startsWith('```')){
        const language=line.slice(3).trim().split(/\s/)[0].toLowerCase();const code=[];i++;
        while(i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i++]);if(i<lines.length)i++;
        const block=el('div');block.className='code-block';const bar=el('div');bar.className='code-bar';bar.append(el('span',language||'Code'));const button=el('button','Copy code');button.type='button';button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(code.join('\n'));button.textContent='Copied';}catch{button.textContent='Select code to copy';}setTimeout(()=>button.textContent='Copy code',2000);});bar.append(button);const pre=el('pre'),c=el('code');highlight(c,code.join('\n'),language);pre.append(c);block.append(bar,pre);root.append(block);continue;
      }
      if(!line.trim()){i++;continue;}
      const heading=line.match(/^(#{1,4})\s+(.+)$/);if(heading){const h=el('h'+Math.min(heading[1].length+1,4));inline(h,heading[2]);root.append(h);i++;continue;}
      if(/^\s*([-*]|\d+\.)\s+/.test(line)){
        const ordered=/^\s*\d+\./.test(line),list=el(ordered?'ol':'ul');
        while(i<lines.length&&(ordered?/^\s*\d+\.\s+/:/^\s*[-*]\s+/).test(lines[i])){const item=el('li');inline(item,lines[i++].replace(/^\s*(?:[-*]|\d+\.)\s+/,''));list.append(item);}root.append(list);continue;
      }
      if(line.startsWith('> ')){const q=el('blockquote');inline(q,line.slice(2));root.append(q);i++;continue;}
      const p=el('p');inline(p,line);root.append(p);i++;
    }
    return root;
  }
  return {render};
})();
