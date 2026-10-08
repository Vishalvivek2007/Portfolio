// All copy and data. Unknown facts stay as TODO(vishal); `npm run check:content` fails while any remain.
export const TODO = "TODO(vishal)";

export const content = {
  name: { first: "Vishal", last: "Vivek" },
  tagline: "I build full-stack and machine-learning products that people actually use.",
  school: "Computer science, VIT Vellore",
  next: "Joining Microsoft as an intern",
  email: TODO,
  links: [
    { label: "GitHub", handle: TODO, href: "#" },
    { label: "LinkedIn", handle: TODO, href: "#" },
    { label: "X", handle: TODO, href: "#" },
    { label: "LeetCode", handle: TODO, href: "#" },
    { label: "Résumé", handle: "pdf", href: "#" },
  ],
  projects: [
    {
      name: "VMAXX",
      summary: "A streaming front end that helps you pick what to watch by mood, era and quality.",
      href: "https://vmaxx.vercel.app/",
      repo: TODO,
      does: [
        "Browse by mood: Chill and easy, Mind-bending, Pure adrenaline, Laugh out loud",
        "Filter by era and by quality tier: Verified bangers, Masterpieces, Hidden gems",
        "Surprise me picks something for you",
        "Top 10 this week and Continue watching",
        "Search, sign-in and a personal list",
      ],
      stack: TODO,
      role: TODO,
    },
  ],
  about: [
    "I'm Vishal, a third-year computer science student at VIT Vellore. I like building things people end up using: the kind of project a stranger opens twice.",
    "Most of my work sits where full-stack web meets machine learning. Fast interfaces in front, models and data behind them. I've interned at Deep Terrain AI and " + TODO + ", and I'm joining Microsoft as an intern next.",
    "When I'm not shipping something, I'm usually working through data structures and algorithms. I enjoy the puzzle of it more than I probably should.",
  ],
  facts: [
    ["Based in", "Vellore, India"],
    ["Studying", "B.Tech CSE, VIT"],
    ["Next", "Microsoft, intern"],
    ["Into", "DSA, full-stack, ML"],
  ] as [string, string][],
  stack: {
    "Full-stack": ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL"],
    "AI and ML": ["Python", "PyTorch", "scikit-learn", "Pandas"],
    Foundations: ["DSA", "C++", "Git", "Linux"],
  } as Record<string, string[]>,
  experience: [
    { company: "Microsoft", role: TODO, when: "Upcoming", upcoming: true, points: [] as string[] },
    { company: "Deep Terrain AI", role: TODO, when: TODO, upcoming: false, points: [TODO] },
    { company: TODO, role: TODO, when: TODO, upcoming: false, points: [TODO] },
  ],
  education: "B.Tech Computer Science, VIT Vellore, expected 2028",
};
export type Content = typeof content;
