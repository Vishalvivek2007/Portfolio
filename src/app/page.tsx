import Shell from "@/components/shell/Shell";
import Home from "@/components/sections/Home";
import Work from "@/components/sections/Work";
import About from "@/components/sections/About";
import Stack from "@/components/sections/Stack";
import Lab from "@/components/sections/Lab";
import Experience from "@/components/sections/Experience";
import GitGrid from "@/components/GitGrid";
import Contact from "@/components/sections/Contact";

export default function Page() {
  return (
    <>
      <Shell />
      <main className="relative z-10">
        <Home />
        <Work />
        <About />
        <Stack><GitGrid /></Stack>
        <Lab />
        <Experience />
        <Contact />
      </main>
    </>
  );
}
