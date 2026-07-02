export default function MediaLibraryDeprecated() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
        <span className="text-3xl">🤖</span>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">Fully Automated</h1>
      <p className="text-zinc-400 mt-4 text-lg max-w-2xl leading-relaxed">
        This manual Media Library is <strong>deprecated</strong> in Phase 2. <br/><br/>
        Your videos are now processed by the Kaggle GPU, uploaded to Cloudflare R2, and automatically fetched & published by your local <strong>uploader-agent</strong> using Puppeteer. 
        <br/><br/>
        No manual clicking required. Just keep the uploader-agent running!
      </p>
      <a href="/" className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
        Return to Dashboard
      </a>
    </div>
  );
}
