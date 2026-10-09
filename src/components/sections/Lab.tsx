import Drive from "@/components/lab/Drive";
import Digits from "@/components/lab/Digits";

export default function Lab() {
  return (
    <section id="lab" className="section">
      <h2 className="h2 mb-6">Lab</h2>
      <p className="lead max-w-[34ch] mb-16">Things I built because they are fun to poke at. All of it runs live in your browser.</p>
      <Drive />
      <Digits />
    </section>
  );
}
