/* Le credenziali di R2 rimangono sul server. Le foto sono elaborate sul dispositivo. */
async function vivaldiResize(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>30*1024*1024)throw Error('Scegli una foto JPEG, PNG o WebP fino a 30 MB.');
 const bitmap=await createImageBitmap(file);const scale=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.82));if(!blob)throw Error('Non è stato possibile elaborare la foto.');return blob;
}
async function vivaldiUpload(file,kind){
 let blob=file;if(kind==='image')blob=await vivaldiResize(file);
 const allowed=kind==='pdf'?['application/pdf']:kind==='video'?['video/mp4','video/webm']:['image/webp','image/png'];
 if(!allowed.includes(blob.type))throw Error('Formato non supportato.');const limit=kind==='video'?25:kind==='pdf'?20:10;if(blob.size>limit*1024*1024)throw Error(`Il file supera ${limit} MB.`);
 const response=await fetch('/api/media',{method:'POST',credentials:'same-origin',headers:{'Content-Type':blob.type},body:blob});let result;try{result=await response.json();}catch{throw Error('Caricamento disponibile sul sito pubblicato, dopo la configurazione Cloudflare.');}if(!response.ok)throw Error(result.error||'Caricamento non riuscito.');return result.url;
}
const R2Control=window.createClass({
 getInitialState(){return {busy:false,error:''};},
 isValid(){return this.state.busy?'Attendi la fine del caricamento.':this.state.error||true;},
 async upload(event){const input=event.target;const file=input.files[0];if(!file)return;this.setState({busy:true,error:''});try{const url=await vivaldiUpload(file,this.props.field.get('kind')||'image');this.props.onChange(url);}catch(error){this.setState({error:error.message});}finally{this.setState({busy:false});input.value='';}},
 render(){const kind=this.props.field.get('kind')||'image';const value=this.props.value||'';return window.h('div',{},window.h('input',{id:this.props.forID,type:'file',disabled:this.state.busy,accept:kind==='pdf'?'.pdf':kind==='video'?'.mp4,.webm':'.jpg,.jpeg,.png,.webp',onChange:this.upload}),window.h('p',{role:'status'},this.state.busy?'Elaborazione e caricamento…':this.state.error||'Le foto vengono ridimensionate automaticamente. PDF: massimo 20 MB; video: 25 MB.'),value&&window.h('div',{},kind==='image'&&window.h('img',{src:value,alt:'Anteprima',style:{maxWidth:'220px',maxHeight:'160px'}}),window.h('a',{href:value,target:'_blank',rel:'noopener'},' Apri file'),window.h('button',{type:'button',disabled:this.state.busy,onClick:()=>{this.props.onChange('');this.setState({error:''});}},'Rimuovi dal contenuto')));}
});
CMS.registerWidget('r2-file',R2Control);
const exitButton=document.createElement('button');exitButton.textContent='Chiudi sessione';exitButton.style.cssText='position:fixed;bottom:12px;left:12px;z-index:9999;padding:8px 12px;background:#faf8f3;border:1px solid #aaa;border-radius:4px;cursor:pointer';exitButton.onclick=async()=>{try{await fetch('/api/logout',{method:'POST',credentials:'same-origin'});}finally{localStorage.removeItem('decap-cms-user');location.reload();}};document.body.append(exitButton);
