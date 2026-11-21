import Link from "next/link";

// Single source for app navigation: the desktop sidebar and the mobile drawer both render this.
type NavLink = { href: string; label: string; icon: React.ReactNode; also?: string[] };

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const NAV_GROUPS: { label: string; links: NavLink[] }[] = [
  {
    label: "Learn",
    links: [
      {
        href: "/dashboard",
        label: "Dashboard",
        also: ["/roadmap"],
        icon: (
          <Icon>
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="8" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="8" width="6" height="6" rx="1" />
            <rect x="8" y="8" width="6" height="6" rx="1" />
          </Icon>
        ),
      },
      {
        href: "/assessment",
        label: "Career Discovery",
        icon: (
          <Icon>
            <circle cx="7.5" cy="7.5" r="6" />
            <circle cx="7.5" cy="7.5" r="2" />
          </Icon>
        ),
      },
      {
        href: "/practice",
        label: "Practice",
        icon: (
          <Icon>
            <path d="M5 4L1.5 7.5L5 11M10 4l3.5 3.5L10 11M8.5 2.5l-2 10" />
          </Icon>
        ),
      },
      {
        href: "/review",
        label: "Review",
        icon: (
          <Icon>
            <path d="M2 7.5a5.5 5.5 0 109.4-3.9" />
            <path d="M11.5 1.5v2.3H9.2" />
            <path d="M7.5 5v2.7l1.8 1.1" />
          </Icon>
        ),
      },
      {
        href: "/build",
        label: "What to Build",
        icon: (
          <Icon>
            <circle cx="3" cy="3.5" r="2" />
            <circle cx="12" cy="3.5" r="2" />
            <circle cx="7.5" cy="11.5" r="2" />
            <path d="M4.3 5L6.7 9.9M10.7 5L8.3 9.9M5 3.5h5" />
          </Icon>
        ),
      },
    ],
  },
  {
    label: "Career",
    links: [
      {
        href: "/internships",
        label: "Internships",
        icon: (
          <Icon>
            <rect x="1.5" y="4.5" width="12" height="8.5" rx="1.2" />
            <path d="M5.5 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M1.5 8h12" />
          </Icon>
        ),
      },
      {
        href: "/certificates",
        label: "Certificates",
        icon: (
          <Icon>
            <circle cx="7.5" cy="6" r="4.5" />
            <path d="M5 9.5L4 14l3.5-1.8L11 14l-1-4.5" />
          </Icon>
        ),
      },
    ],
  },
  {
    label: "You",
    links: [
      {
        href: "/progress",
        label: "Progress",
        icon: (
          <Icon>
            <path d="M1.5 11.5L5 7.5L8 9.5L12 4.5" />
            <path d="M11 4.5H13V6.5" />
          </Icon>
        ),
      },
      {
        href: "/leaderboard",
        label: "Leaderboard",
        icon: (
          <Icon>
            <rect x="1" y="7" width="4" height="6.5" rx="0.8" />
            <rect x="5.5" y="3" width="4" height="10.5" rx="0.8" />
            <rect x="10" y="9" width="4" height="4.5" rx="0.8" />
          </Icon>
        ),
      },
      {
        href: "/pricing",
        label: "Credits",
        icon: (
          <Icon>
            <path d="M7.5 1.5v12M10.5 4H6a1.75 1.75 0 100 3.5h3a1.75 1.75 0 110 3.5H4.5" />
          </Icon>
        ),
      },
    ],
  },
];

// Shown only when the server says the user is in ADMIN_EMAILS; the page itself re-checks.
export const ADMIN_GROUP = {
  label: "Admin",
  links: [
    {
      href: "/admin/ai",
      label: "AI evaluation",
      icon: (
        <Icon>
          <path d="M7.5 1.5L13 3.5V7.5C13 10.5 10.5 12.8 7.5 13.5C4.5 12.8 2 10.5 2 7.5V3.5L7.5 1.5Z" />
        </Icon>
      ),
    },
  ],
};

export function isActive(pathname: string, link: NavLink) {
  return [link.href, ...(link.also ?? [])].some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Grouped link list shared by the sidebar and the mobile drawer. */
export function NavList({
  pathname,
  isAdmin,
  onNavigate,
}: {
  pathname: string;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const groups = isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;
  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#a8a49d]">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.links.map((link) => {
              const active = isActive(pathname, link);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={
                      "group flex items-center gap-3 rounded-[8px] px-3 py-2 text-[13.5px] font-medium transition-colors " +
                      (active
                        ? "bg-white text-[#111111] shadow-[0_1px_2px_rgba(17,17,17,0.06)] ring-1 ring-[#e4dfd7]"
                        : "text-[#55534f] hover:bg-[#ece7e0] hover:text-[#111111]")
                    }
                  >
                    <span
                      className={
                        "shrink-0 transition-colors " +
                        (active ? "text-[#ff5600]" : "text-[#a8a49d] group-hover:text-[#111111]")
                      }
                    >
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
