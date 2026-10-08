import Shell from "@/components/shell/Shell";
import Home from "@/components/sections/Home";
import Work from "@/components/sections/Work";
import About from "@/components/sections/About";
import Stack from "@/components/sections/Stack";
import Experience from "@/components/sections/Experience";
import Contact from "@/components/sections/Contact";

export default function Page() {
  return (
    <>
      <Shell />
      <main className="relative z-10">
        <Home />
        <Work />
        <About />
        <Stack />
        <Experience />
        <Contact />
      </main>
    </>
  );
}
