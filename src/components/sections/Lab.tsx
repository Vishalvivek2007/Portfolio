import Board from "@/components/lab/Board";

export default function Lab() {
  return (
    <section id="lab" className="section">
      <h2 className="h2 mb-6">Lab</h2>
      <p className="lead max-w-[36ch] mb-14">Draw anything. A net I trained guesses while you draw, and a bigger model has the final word.</p>
      <Board />
    </section>
  );
}
