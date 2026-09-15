# Accademia Musicale A. Vivaldi — pubblicazione

## Cosa è pronto

Il sito include homepage modificabile, copertina foto/video, corsi con icone, sette sedi con mappa OpenStreetMap, contatti dei due insegnanti, notizie, gallerie filtrabili per anno e località, album con fotografie ingrandibili, documenti PDF scaricabili e Privacy Policy.

Il pannello Decap è in `/admin/`. La configurazione indica già:

- sito: https://www.accademiamusicalevivaldi.com
- repository: https://github.com/accademiamusicalevivaldi/accademia-musicale-vivaldi
- ramo: `main`
- bucket R2: `accademia-musicale-vivaldi`

**Stato della consegna:** progetto costruito e verificato localmente. Il repository pubblico è stato verificato: esiste, è vuoto e usa il ramo main. Il bucket è configurato nei file ma non è stato verificato tramite accesso al tuo account. Nessun servizio remoto è stato modificato. Il sito non è stato pubblicato da questa sessione. Mancano l'attivazione del progetto Pages, l'app OAuth GitHub e i relativi valori riservati. Non servono chiavi S3/R2 nel browser.

## 1. Carica i sorgenti su GitHub

Usa la cartella `sorgenti` del pacchetto, contenente anche `package.json`, `package-lock.json`, `wrangler.toml`, `src`, `public`, `functions` e `server`. Carica **il contenuto** nella radice del repository indicato sopra, sul ramo `main`, conservando i percorsi. Non caricare la cartella esterna `sorgenti`, `node_modules`, credenziali o cartelle di cache. Includi i file nascosti `.gitignore` e `.dev.vars.example`; quest'ultimo contiene solo campi vuoti.

Se nel repository esistono già altri file, confrontali prima di sovrascriverli. La consegna non ha cancellato né sostituito file remoti.

## 2. Collega Cloudflare Pages al repository

In Cloudflare apri Workers & Pages e crea un progetto **Pages con integrazione Git**, scegliendo il repository. Configura:

| Impostazione | Valore |
| --- | --- |
| Ramo di produzione | `main` |
| Comando di compilazione | `npm run build` |
| Directory di output | `dist` |
| Directory principale | radice del repository |
| Versione Node | `22` (variabile `NODE_VERSION`) |

La compilazione genera il sito e il file `_worker.js`, necessario per l'accesso amministrativo e R2. Collega il dominio `www.accademiamusicalevivaldi.com` tramite la sezione **Custom domains** del progetto. Il solo puntamento DNS non sostituisce questo collegamento. Configura anche il dominio senza `www` con reindirizzamento al dominio principale, se desiderato.

Usa l'integrazione Git: quando salvi un contenuto con Decap, viene creato un aggiornamento nel repository e Cloudflare ricostruisce il sito automaticamente. Attendi il completamento della compilazione prima di controllare la pagina pubblica.

## 3. Collega R2 al progetto

Il file `wrangler.toml` contiene già il collegamento `MEDIA` al bucket `accademia-musicale-vivaldi`. Verifica nel progetto Pages che il binding R2 si chiami esattamente **MEDIA** e punti a quel bucket, nello stesso account Cloudflare. Con pubblicazione manuale, aggiungi questo binding dalle impostazioni del progetto.

Non occorre rendere pubblico il bucket, attivare un dominio `r2.dev` o impostare CORS: i contenuti passano dal dominio del sito, attraverso `/media/…`. Gli upload usano `/api/media`, con controllo dell'accesso GitHub. Gli URL dei materiali sono pubblici: la pagina documenti è una raccolta scaricabile da tutti, non un'area riservata agli alunni.

## 4. Attiva l'accesso GitHub (una sola volta)

Nel tuo account GitHub vai in **Settings → Developer settings → OAuth Apps → New OAuth App**. Inserisci:

- nome: `Accademia Vivaldi CMS`
- Homepage URL: `https://www.accademiamusicalevivaldi.com`
- Authorization callback URL: `https://www.accademiamusicalevivaldi.com/api/callback`

Copia Client ID e Client Secret direttamente nelle impostazioni **Variables and Secrets** del progetto Cloudflare Pages. Aggiungi:

| Nome | Valore |
| --- | --- |
| `GITHUB_CLIENT_ID` | Client ID dell'app appena creata |
| `GITHUB_CLIENT_SECRET` | Client Secret, come segreto cifrato |
| `SESSION_SECRET` | stringa casuale lunga almeno 32 caratteri, come segreto cifrato |

Puoi generare una stringa casuale nel tuo gestore di password oppure con `openssl rand -hex 32`. Non inviare questi valori in chat e non inserirli nei file pubblici o nel repository.

Sono già presenti in `wrangler.toml` le variabili non segrete `APP_ORIGIN`, `GITHUB_REPO` e `GITHUB_BRANCH`. Se pubblichi manualmente la cartella compilata, aggiungile anche nelle impostazioni Cloudflare copiando i valori dal file.

Ridistribuisci il progetto dopo aver impostato binding e segreti. Accedi a `https://www.accademiamusicalevivaldi.com/admin/` con un account GitHub che abbia permesso di scrittura sul repository. L'app richiede l'ambito GitHub `repo`, usato da Decap per leggere e salvare i contenuti; un account dedicato al sito limita l'estensione dell'accesso. L'amministrazione funziona sul dominio canonico, non sul dominio di anteprima Pages.

## 5. Usa il pannello

- **Impostazioni del sito → Homepage:** testi, foto provvisoria e futuro video di apertura.
- **Contatti e dati del sito:** email, nomi e numeri, dati del titolare. Cambiare il dominio richiede anche l'aggiornamento della configurazione tecnica e dell'app OAuth.
- **Corsi:** descrizioni e percorsi delle icone già incluse.
- **Sedi e mappa:** località e coordinate indicative.
- **Notizie:** titolo, data, riassunto, copertina e testo.
- **Gallerie:** titolo, data, località e foto. Aggiungi una voce per ogni fotografia, carica il file e descrivilo. Le voci possono essere riordinate o rimosse.
- **Materiale didattico:** titolo, categoria, descrizione e PDF.
- **Privacy Policy:** testo dell'informativa e data di aggiornamento.

Per notizie, gallerie e documenti nuovi la casella **Bozza** è attiva: disattivala e salva quando vuoi rendere il contenuto visibile. Anche un salvataggio in bozza può attivare una compilazione, ma il contenuto rimane escluso dalle pagine pubbliche.

### Foto, video e PDF

Usa i pulsanti di caricamento nei singoli campi: sono quelli collegati a R2. La libreria generale “Media” di Decap salva invece file nel repository e non è il percorso consigliato per le fotografie.

Lo script `public/admin/upload.js` ridimensiona JPEG, PNG e WebP a un massimo di **2000 pixel sul lato lungo**, senza ingrandire le foto piccole. Esporta WebP con qualità 82%, eliminando i metadati tramite canvas. Se il browser non esporta WebP, usa PNG. Sono accettati originali fino a 30 MB; il file elaborato non deve superare 10 MB. Gli originali sul computer non vengono modificati: conservali come archivio.

- PDF: fino a **20 MB**, conservato senza modifiche.
- Video: MP4 o WebM fino a **25 MB**, senza conversione automatica. Per la copertina preferisci un filmato breve e compresso MP4 H.264. La foto resta come anteprima/fallback.
- Se la sessione di caricamento scade, usa **Chiudi sessione** e accedi nuovamente.
- Rimuovere una foto da un album non cancella il file da R2; evita così di interrompere altri contenuti che lo utilizzano. Per cancellare definitivamente un file usa R2 dopo aver verificato tutti i riferimenti. I media possono restare nella cache fino a 24 ore.

## 6. Controllo finale online

Dopo l'attivazione verifica: login, modifica di un testo, aggiornamento automatico Pages, caricamento di una foto, visualizzazione dell'album, download di un PDF e video quando disponibile. Queste prove sul tuo account sono ancora da eseguire; i test locali usano un archivio e risposte GitHub simulati.

L'informativa include i dati del titolare forniti e l'accenno a OpenStreetMap. Verifica che descriva le effettive pratiche dell'Accademia, in particolare conservazione, fornitori e basi per la pubblicazione di fotografie. Il sito include Google Fonts esterni, dichiarati nell'informativa. Non sono stati aggiunti strumenti pubblicitari o di analisi.

## Alternativa: caricamento immediato dei file compilati

La cartella `sito-compilato` contiene già tutti i file da caricare con Direct Upload su Pages, incluso `_worker.js`. Devi comunque configurare binding, variabili e segreti. **Il caricamento manuale da solo non attiva gli aggiornamenti automatici dopo i salvataggi Decap.** Per la gestione ordinaria usa il progetto Pages con integrazione Git descritto sopra. Un progetto Pages nato con Direct Upload non si converte direttamente in un progetto Git: crealo con Git dall'inizio se vuoi usare il pannello stabilmente.

## Comandi per la manutenzione

Con Node 22 o successivo, nella radice del progetto:

```sh
npm ci
npm test
npm run build
npm run dev
```

Per provare il pannello con contenuti locali apri un secondo terminale ed esegui `npm run cms:local`; poi visita `/admin/` sul server locale. Il proxy locale consente modifiche ai file del progetto: arrestalo quando hai finito. I caricamenti R2 richiedono invece il sito online configurato.

`scripts/check-publication.mjs` verifica la generazione di articoli, album e documenti con contenuti temporanei, poi li rimuove e ricostruisce il sito pulito. `npm test` verifica sessioni cifrate, autorizzazioni, formati, dimensioni, download parziali e pulizia del testo Markdown.

Il file `scripts/setup-cms.mjs` serve solo per rigenerare lo schema del pannello dopo modifiche strutturali ai dati; non occorre eseguirlo quando modifichi normali contenuti.

## Fonti e risorse

- [Cloudflare Pages con Git](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Pubblicazione diretta e supporto Worker](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Decap con GitHub](https://decapcms.org/docs/github-backend/)
- [Privacy OpenStreetMap](https://osmfoundation.org/wiki/Privacy_Policy)
- [Regolamento GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj/?locale=it)
- Fotografia provvisoria: [Johannes Plenio su Unsplash](https://unsplash.com/photos/piano-keys-RWytwNueNng).
- Logo e icone: materiali forniti dall'Accademia. Leaflet e Decap CMS sono distribuiti secondo le rispettive licenze open source.
