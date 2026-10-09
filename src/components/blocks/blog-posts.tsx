import type { CollectionEntry } from "astro:content";
import { format } from "date-fns";

const BlogPosts = ({ posts }: { posts: CollectionEntry<"blog">[] }) => (
  <section className="container max-w-5xl">
    <div className="max-w-2xl space-y-5">
      <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
        Kojima / Field notes
      </p>
      <h1 className="text-4xl tracking-tight md:text-5xl">
        Signals. Context. Decisions.
      </h1>
      <p className="text-muted-foreground leading-relaxed">
        Working notes on corporate intelligence, geopolitical risk, and supply
        chain exposure. All scenarios are synthetic demonstrations.
      </p>
    </div>
    <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <a
          key={post.id}
          href={`/blog/${post.id}/`}
          className="group border-border bg-background hover:bg-muted/40 focus-visible:outline-ring flex min-w-0 flex-col border transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <div className="text-muted-foreground border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 font-mono text-xs">
            <span>NOTE / {String(index + 1).padStart(2, "0")}</span>
            <time dateTime={new Date(post.data.pubDate).toISOString()}>
              {format(post.data.pubDate, "yyyy.MM.dd")}
            </time>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h2 className="text-xl leading-snug tracking-tight group-hover:underline group-hover:underline-offset-4">
              {post.data.title}
            </h2>
            <p className="text-muted-foreground mt-4 line-clamp-3 text-sm leading-relaxed">
              {post.data.description}
            </p>
            <div className="text-muted-foreground mt-auto flex flex-wrap items-center justify-between gap-3 pt-8 font-mono text-xs">
              <span>{post.data.authorName || "Kojima demo"}</span>
              <span className="text-foreground">
                Read note <span aria-hidden="true">↗</span>
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
    {posts.length === 0 && (
      <p className="text-muted-foreground border-border mt-10 border-t pt-6 font-mono text-sm">
        No field notes published yet.
      </p>
    )}
  </section>
);

export { BlogPosts };
