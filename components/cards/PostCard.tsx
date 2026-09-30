"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, isWithinDays } from "@/lib/format";
import type { PostWithAuthorAndCount } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { getPostExcerpt } from "@/lib/utils/editorjs";
import { ImageIcon, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PostCardProps {
  post: PostWithAuthorAndCount;
  className?: string;
  priority?: boolean;
  excerpt?: string;
}

export function PostCard({
  post,
  className,
  priority = false,
  excerpt: excerptProp,
}: PostCardProps) {
  const isNew = isWithinDays(post.published_at ?? post.updated_at, 3);
  const authorInitials = post.author.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const coverUrl = post.cover_image_url?.trim() || "";
  const excerpt = excerptProp ?? getPostExcerpt(post.content);

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md",
        className
      )}
    >
      <Link href={`/community/${post.id}`} className="flex h-full min-h-0 flex-col">
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-muted">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/60">
              <ImageIcon className="h-12 w-12" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <CardHeader className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-2 text-lg group-hover:text-primary">
                {post.title}
              </CardTitle>
              {isNew && <Badge variant="secondary">Mới</Badge>}
            </div>
            {excerpt ? (
              <CardDescription className="line-clamp-2">{excerpt}</CardDescription>
            ) : null}
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={post.author.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {post.author.full_name}
              </span>
            </div>
          </CardContent>

          <CardFooter className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatDateTime(post.published_at ?? post.updated_at)}</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.comment_count} bình luận
            </span>
          </CardFooter>
        </div>
      </Link>
    </Card>
  );
}
