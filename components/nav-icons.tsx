type NavIconProps = {
  className?: string;
};

function Icon({
  className = "h-4 w-4 shrink-0",
  children,
}: NavIconProps & { children: React.ReactNode }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function NavIconHome(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <path d="M4 10 12 4l8 6v9H4z" />
    </Icon>
  );
}

export function NavIconNews(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <path d="M4 6h16v12H4z" />
      <path d="M8 10h8M8 14h5" />
    </Icon>
  );
}

export function NavIconLaw(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </Icon>
  );
}

export function NavIconVote(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <path d="M5 12h14M12 5v14" />
      <path d="M8 8l4-3 4 3M8 16l4 3 4-3" />
    </Icon>
  );
}

export function NavIconPeople(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <circle cx="9" cy="8" r="2.5" />
      <circle cx="16" cy="9" r="2" />
      <path d="M4 18c0-2.5 2.2-4 5-4s5 1.5 5 4" />
      <path d="M14 18c0-1.8 1.3-3 3-3" />
    </Icon>
  );
}

export function NavIconGroups(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </Icon>
  );
}

export function NavIconCompare(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <path d="M7 7h4v10H7zM13 7h4v6h-4z" />
      <path d="M5 19h14" />
    </Icon>
  );
}

export function NavIconCompass(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8l2 4-4 2 2-6z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function NavIconBook(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <path d="M5 4h8a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
      <path d="M8 4h8v13" />
    </Icon>
  );
}

export function NavIconInfo(p: NavIconProps): React.ReactElement {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 10v6M12 7h.01" />
    </Icon>
  );
}

export type NavIconComponent = (p: NavIconProps) => React.ReactElement;

export const NAV_ICON_BY_HREF: Record<string, NavIconComponent> = {
  "/": NavIconHome,
  "/actualite": NavIconNews,
  "/dossiers": NavIconLaw,
  "/scrutins": NavIconVote,
  "/deputes": NavIconPeople,
  "/senateurs": NavIconPeople,
  "/groupes": NavIconGroups,
  "/comparateur": NavIconCompare,
  "/boussole": NavIconCompass,
  "/philosophies": NavIconBook,
  "/methodologie": NavIconInfo,
};
