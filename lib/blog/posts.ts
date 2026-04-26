export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  dateIso: string;
  readTimeMinutes: number;
  description: string;
  paragraphs: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-i-grew-to-215k-on-tiktok",
    title: "How I grew to 215k on TikTok working 2 hours a week",
    category: "Growth",
    date: "Apr 2026",
    dateIso: "2026-04-15",
    readTimeMinutes: 3,
    description:
      "Covers, a full-time sales job, burnout, and what I actually learned about consistency on the way to 215k.",
    paragraphs: [
      "Nobody tells you that growth can feel like a second job you did not apply for. I was working full-time in sales, which already meant long days on the phone and a brain that was fried by dinner. TikTok was supposed to be the fun outlet. It turned into something bigger because I kept posting covers — not because I had a perfect strategy, but because singing was the one thing I could still do when I was tired.",
      "The covers were simple: phone propped up, decent light when I remembered, songs people already loved. I was not reinventing music theory. I was showing up in a format people could scroll into without thinking. That is a huge advantage when your real life does not leave room for elaborate production. Two hours a week was not a humble-brag schedule — it was literally what I had after work, food, and trying to be a functioning human.",
      "Here is the honest part: I burned out anyway. The account grew, the comments stacked up, and the pressure to keep the streak alive started to feel heavier than the job that paid my rent. I started skipping sleep to edit. I started resenting the thing I used to love. The algorithm does not care that you are tired. It just notices when you go quiet.",
      "What I learned was not \"hustle harder.\" It was that consistency without a system is just anxiety with a microphone. Talent helped me sound okay on a bad day, but talent did not schedule posts, batch ideas, or protect my mental health when I hit a wall. The creators who last are not the ones who never flame out — they are the ones who build something sustainable before the flame gets too close.",
      "If I could rewind, I would have treated my content calendar like a sales pipeline: predictable touchpoints, clear priorities, and a hard stop when my body said no. I would have stopped confusing momentum with moral worth. A quiet week does not erase the months you already put in. It just means you are human, and humans need rest even when the numbers look tempting.",
      "If you are in the messy middle right now — growing but exhausted — I see you. Growth is not proof that you have unlimited energy. It is proof that something resonated. The next step is making sure you can keep showing up without losing yourself in the process. That is the work I wish I had done earlier, and it is the whole reason I care so much about systems now.",
    ],
  },
  {
    slug: "why-consistency-beats-talent-for-creators",
    title: "Why consistency beats talent for creators",
    category: "Mindset",
    date: "Apr 2026",
    dateIso: "2026-04-18",
    readTimeMinutes: 3,
    description:
      "Showing up on repeat beats being the most gifted person in your niche — here is why I believe that after years in the trenches.",
    paragraphs: [
      "I used to think the internet rewarded the best. The best singer, the best editor, the best storyteller — whoever had the most raw gift would float to the top. After years of making content and watching other people make content, I do not believe that anymore. The feed rewards motion. It rewards people who show up often enough that the platform can trust them with attention.",
      "Talent still matters. A talented person who posts consistently is dangerous in the best way. But a talented person who posts once a month is mostly invisible. Meanwhile, someone \"pretty good\" who ships three times a week is running experiments the algorithm can actually learn from. Every post is a data point. If you barely post, you are guessing in the dark with a tiny sample size.",
      "Consistency also compounds in a way talent alone does not. You get faster at editing, sharper at hooks, better at reading comments for what landed. You stop treating every upload like a referendum on your worth because there is another one coming. That emotional stability is underrated. It is easier to take smart risks when one video is not carrying the entire identity of your brand. Over a year, those small improvements stack into a style people recognize before they even read your name.",
      "The trap is thinking consistency means grinding until you break. That is not what I am arguing for. I am arguing for a steady signal — something your audience and the platform can rely on — that fits your real life. That might be two short videos a week instead of seven perfect ones. It might be batching on Sunday so your weekdays do not explode. The point is the pattern, not the pain.",
      "I have watched friends with more natural charisma than me stall out because posting felt like a performance they could only do when inspiration struck. Inspiration is unreliable. A simple rhythm — even a boring one — beats waiting for lightning. Boring, by the way, is how most careers are built. The highlight reel is not the whole story.",
      "If you are talented and inconsistent, you are leaving opportunity on the table. If you are consistent and willing to learn, you give yourself a real shot — not because the internet is fair, but because volume plus iteration is how you steer. Talent opens the door. Consistency is what keeps you in the room.",
    ],
  },
  {
    slug: "the-system-i-built-to-never-miss-a-post",
    title: "The system I built to never miss a post again",
    category: "Systems",
    date: "Apr 2026",
    dateIso: "2026-04-22",
    readTimeMinutes: 3,
    description:
      "Why I built Creator OS after burning out — and how a single dashboard helps me show up without losing the plot.",
    paragraphs: [
      "Creator OS started as a selfish project. I needed one place to see what was happening across platforms without opening five apps and spiraling. I needed my ideas, my calendar, and my energy to talk to each other instead of pretending they lived in separate universes. I was tired of being the only integration layer between my brain and the internet.",
      "The problem was never \"I forgot I like making content.\" The problem was life. A busy week at work, a family thing, a random Tuesday where everything felt heavy — and suddenly posting felt optional. Optional becomes skipped. Skipped becomes silence. Silence becomes that awful voice that says you blew it. I wanted a system that made skipping harder without making creativity feel like factory work.",
      "So I built around a simple idea: creators do better when the tools match how they actually live. That means connecting the channels you care about, seeing performance in one glance, and getting support that respects your real schedule — not a fantasy version of you who has six hours to film on a Wednesday. The product is still growing, but the north star is consistency with guardrails. Show up, but do not destroy yourself to do it.",
      "How it works in practice: you bring your platforms, you see your metrics in one dashboard, and you use the rest of the app to plan and execute without bouncing between tabs until your head hurts. The goal is not to squeeze more hours out of you. It is to remove friction so the two hours you do have actually move the needle. When you can see what is working across channels, you stop posting from pure panic and start posting with a little more intention.",
      "I am not pretending software fixes everything. Your habits still matter. Your boundaries still matter. But the right tool can make the good choice the easy choice — like having your week visible next to your ideas so you do not double-book your own energy. That is the kind of boring upgrade that saves careers.",
      "If you are building in public, or trying to come back after burnout, or just sick of flying blind — that is the person I built this for. Not the creator who has it all figured out, but the one who still cares and needs a better way to keep the promise they made to their audience. I am that person too. Creator OS is the system I needed. Maybe it helps you the way building it helped me.",
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export type BlogPostSummary = Pick<
  BlogPost,
  "slug" | "title" | "category" | "date" | "readTimeMinutes"
>;

export const blogPostSummaries: BlogPostSummary[] = blogPosts.map(
  ({ slug, title, category, date, readTimeMinutes }) => ({
    slug,
    title,
    category,
    date,
    readTimeMinutes,
  }),
);
