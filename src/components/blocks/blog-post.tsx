import type { ReactNode } from "react";

import type { CollectionEntry } from "astro:content";
import { format } from "date-fns";

const BlogPost = ({
  post,
  children,
}: {
  post: CollectionEntry<"blog">;
  children: ReactNode;
}) => {
  const { title, authorName, pubDate, description } = post.data;
  return (
    <article className="container max-w-5xl">
      <header className="border-border border-b pb-10">
        <a
          href="/blog"
          className="text-muted-foreground focus-visible:outline-ring inline-block font-mono text-xs tracking-widest uppercase underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span aria-hidden="true">← </span>Field notes / Index
        </a>
        <h1 className="mt-8 max-w-4xl text-4xl tracking-tight md:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-6 max-w-3xl text-lg leading-relaxed">
          {description}
        </p>
        <div className="text-muted-foreground mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs">
          {authorName && <span>{authorName}</span>}
          <time dateTime={new Date(pubDate).toISOString()}>
            {format(pubDate, "yyyy.MM.dd")}
          </time>
          <span>Synthetic scenario / Demo</span>
        </div>
      </header>
      <div className="prose prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-foreground prose-blockquote:border-border prose-hr:border-border prose-img:rounded-none prose-img:border prose-img:border-border mx-auto mt-10 max-w-3xl break-words">
        {children}
      </div>
    </article>
  );
};

export { BlogPost };
