import { CompareWorkbench } from "@/components/compare-workbench";
import { loadCorpus } from "@/lib/papers/repository";

export default async function Home() {
  const { papers } = await loadCorpus();

  return (
    <main className="pageShell">
      <section className="hero">
        <div>
          <p className="heroKicker">AI-Enabled Assignment POC</p>
          <h1>RAG Paper Compare</h1>
          <p className="heroCopy">
            A focused application that moves from source ingestion to curated storage,
            retrieval-backed reasoning, and a user-facing comparison workflow.
          </p>
        </div>
        <div className="heroCard">
          <p>Supported</p>
          <ul>
            <li>Compare 2-3 fixed RAG papers</li>
            <li>Use guided prompts with citations</li>
            <li>Explain strengths, evaluation, and POC fit</li>
          </ul>
          <p>Not supported</p>
          <ul>
            <li>Open-ended web research</li>
            <li>User uploads</li>
            <li>Generic chat over arbitrary topics</li>
          </ul>
        </div>
      </section>

      <CompareWorkbench papers={papers} />
    </main>
  );
}
