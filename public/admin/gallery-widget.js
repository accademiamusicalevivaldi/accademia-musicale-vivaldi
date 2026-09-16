const R2GalleryControl=window.createClass({
 getInitialState(){return {busy:false,progress:'',failed:[]};},
 photos(){const value=this.props.value;return value?.toJS?value.toJS():Array.isArray(value)?value:[];},
 isValid(){return this.state.busy?'Attendi il completamento delle fotografie.':this.state.failed.length?'Riprova i caricamenti non riusciti oppure escludili.':true;},
 async select(event){const input=event.target;const files=Array.from(input.files||[]);input.value='';if(files.length)await this.run(files);},
 async run(files){if(this.state.busy)return;let photos=this.photos().slice();const previous=this.state.failed;this.setState({busy:true,failed:[],progress:'Preparazione delle fotografie…'});try{const result=await window.vivaldiUploadBatch(files,{upload:vivaldiUpload,onSuccess:photo=>{photos=[...photos,photo];this.props.onChange(photos);},onProgress:p=>this.setState({progress:`${p.completed} di ${p.total} foto elaborate`})});this.setState({failed:result.failed,progress:`${files.length-result.failed.length} foto caricate${result.failed.length?`, ${result.failed.length} da riprovare`:'.'}`});}catch(error){this.setState({failed:previous.length?previous:files.map(file=>({file,message:error.message})),progress:'Caricamento interrotto.'});}finally{this.setState({busy:false});}},
 move(index,offset){const photos=this.photos().slice();const target=index+offset;if(target<0||target>=photos.length)return;[photos[index],photos[target]]=[photos[target],photos[index]];this.props.onChange(photos);},
 render(){const h=window.h;const photos=this.photos();return h('div',{className:'vivaldi-gallery'},
 h('label',{htmlFor:this.props.forID,style:{display:'block',fontWeight:600,marginBottom:'8px'}},'Aggiungi più fotografie'),
 h('input',{id:this.props.forID,type:'file',multiple:true,accept:'.jpg,.jpeg,.png,.webp',disabled:this.state.busy||this.state.failed.length>0,onChange:this.select}),
 h('p',{},'Seleziona tutte le foto che vuoi. Ridimensionamento automatico; descrizioni facoltative.'),
 h('p',{role:'status','aria-live':'polite'},this.state.progress||`${photos.length} fotografie nell’album`),
 this.state.failed.length>0&&h('div',{role:'alert'},h('ul',{},this.state.failed.map((item,index)=>h('li',{key:index},`${item.file.name}: ${item.message}`))),h('button',{type:'button',disabled:this.state.busy,onClick:()=>this.run(this.state.failed.map(x=>x.file))},'Riprova solo queste foto'),h('button',{type:'button',disabled:this.state.busy,onClick:()=>this.setState({failed:[],progress:'Le foto non riuscite sono state escluse. Puoi salvare quelle già caricate.'})},'Escludi le foto non riuscite')),
 h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'14px'}},photos.map((photo,index)=>h('div',{key:photo.url+'-'+index,style:{padding:'10px',border:'1px solid #ddd',borderRadius:'6px'}},
 h('img',{src:photo.url,alt:photo.alt||`Foto ${index+1}`,loading:'lazy',style:{width:'100%',height:'125px',objectFit:'cover'}}),
 h('input',{type:'text',value:photo.alt||'','aria-label':`Descrizione facoltativa foto ${index+1}`,placeholder:'Descrizione facoltativa',disabled:this.state.busy,onChange:event=>{const list=this.photos().slice();list[index]={...list[index],alt:event.target.value};this.props.onChange(list);},style:{width:'100%',boxSizing:'border-box',margin:'8px 0'}}),
 h('button',{type:'button',disabled:this.state.busy||index===0,'aria-label':`Sposta prima foto ${index+1}`,onClick:()=>this.move(index,-1)},'←'),h('button',{type:'button',disabled:this.state.busy||index===photos.length-1,'aria-label':`Sposta dopo foto ${index+1}`,onClick:()=>this.move(index,1)},'→'),h('button',{type:'button',disabled:this.state.busy,onClick:()=>this.props.onChange(this.photos().filter((_,i)=>i!==index))},'Rimuovi')
 )))
 );}
});
CMS.registerWidget('r2-gallery',R2GalleryControl);
