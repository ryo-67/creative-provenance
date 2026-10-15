// The site footer: the three makers (equal credit, in the order the team
// agreed; see TEAM in lib/site.ts), the team name, and where the project
// came from.

import { Fragment, type ReactNode } from 'react';
import { COURSE, FRICTIONS, PROJECT_RECORD_URL, TEAM } from '@/lib/site';

// Every footer link carries a light underline at rest (--line), so it
// reads as a link without relying on color alone; hover darkens the
// underline to the text color. `primary` sets the text to --foreground
// so the three names and SPY Kids stand out; the rest inherit the
// footer's --faint and read as supporting metadata.
function FooterLink({
  href,
  children,
  primary = false,
  label,
  className = '',
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  label?: string;
  className?: string;
}) {
  const color = primary ? 'text-foreground' : '';
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`${color} ${className} rounded-[2px] underline decoration-line underline-offset-[3px] hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground`}
    >
      {children}
    </a>
  );
}

// Two groups: who made it, then where it came from. The project record
// is the last item of the second group and is hidden when the site is
// framed, since the one framing it is the record itself.
export default function SiteFooter() {
  return (
    <footer className="mt-8 px-6 py-6 text-center text-[13px] leading-relaxed text-faint">
      <div className="mx-auto w-full max-w-[1100px]">
        <p>
          Made by{' '}
          {TEAM.map((person, i) => (
            <Fragment key={person.name}>
              {i > 0 && (i === TEAM.length - 1 ? ', and ' : ', ')}
              <FooterLink href={person.linkedin} primary>
                {person.name}
              </FooterLink>{' '}
              (<FooterLink href={person.portfolio}>Portfolio</FooterLink>)
            </Fragment>
          ))}
          .
        </p>
        <p>
          Together, we call ourselves the{' '}
          <FooterLink href="https://www.youtube.com/watch?v=oTHj7_Q5fKA" primary>
            SPY Kids
          </FooterLink>
          .
        </p>
        <p className="mt-4">
          Created in {COURSE}, for{' '}
          <FooterLink href={FRICTIONS.url}>{FRICTIONS.name}</FooterLink>
          {' at The New School · '}
          <FooterLink href={FRICTIONS.archive}>Archive</FooterLink>
          <span className="framed:hidden">
            {' · '}
            <FooterLink
              href={PROJECT_RECORD_URL}
              label="Project record: Creative Trace on Shoro Roy's portfolio (opens in a new tab)"
              className="whitespace-nowrap"
            >
              Project record
              {/* inline-block keeps the underline off the arrow */}
              <span aria-hidden="true" className="ml-1 inline-block">
                ↗
              </span>
            </FooterLink>
          </span>
        </p>
      </div>
    </footer>
  );
}
