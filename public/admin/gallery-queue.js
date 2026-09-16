/* Una foto alla volta in memoria; selezione multipla per l'utente. */
window.vivaldiUploadBatch=async function(files,{upload,onSuccess,onProgress}){
 const failed=[];let completed=0;
 for(const file of files){onProgress({completed,total:files.length,name:file.name});try{const url=await upload(file,'image');onSuccess({url,alt:''});}catch(error){failed.push({file,message:error.message||'Caricamento non riuscito.'});}completed++;onProgress({completed,total:files.length,name:file.name});}
 return {failed,completed};
};
