/** Kiểm tra pathname hiện tại có khớp menu item không */
export function matchPath(
  currentPath: string,
  pattern: string,
  exact = false
): boolean {
  if (exact) {
    return currentPath === pattern;
  }

  if (pattern === "/") {
    return currentPath === "/";
  }

  return currentPath === pattern || currentPath.startsWith(`${pattern}/`);
}

/**
 * Active menu theo layout segment (useSelectedLayoutSegment).
 * segment: null = trang chủ, 'about' | 'training' | 'community' | ...
 */
export function isNavSegmentActive(segment: string | null, href: string): boolean {
  if (href === "/") {
    return segment === null;
  }
  return segment === href.replace(/^\//, "");
}

/** @deprecated Dùng isNavSegmentActive hoặc matchPath */
export function isActivePath(pathname: string, href: string, exact = false): boolean {
  return matchPath(pathname, href, exact);
}
