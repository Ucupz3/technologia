import { Link } from '@inertiajs/react';
import { CONTACT, SITE } from './data';

const GROUPS = [
    {
        title: 'Quick Links',
        links: [
            ['Home', '/'],
            ['About Us', '/#about'],
            ['Projects', '/projects'],
            ['Products', '/products'],
            ['Blog', '/blog'],
            ['Career', '/career'],
        ],
    },
    {
        title: 'Company',
        links: [
            ['Our Team', `${SITE}/team`],
            ['FAQ', `${SITE}/faq`],
        ],
    },
    {
        title: 'Legal',
        links: [
            ['Privacy Policy', `${SITE}/privacy-policy`],
            ['Terms of Service', `${SITE}/terms-of-service`],
        ],
    },
];

const SOCIALS = [
    ['Facebook', CONTACT.facebook],
    ['X / Twitter', CONTACT.twitter],
    ['Instagram', CONTACT.instagram],
    ['LinkedIn', CONTACT.linkedin],
];

const linkCls = 'transition-colors hover:text-brand-accent';

export default function TeknaFooter() {
    return (
        <footer className="relative z-10 border-t border-brand-border bg-brand-primary pb-8 pt-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
                    <div>
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent text-lg font-bold text-brand-white">T</span>
                            <span className="text-xl font-bold tracking-tight text-brand-text">Tekna.</span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-text-muted">
                            We are a trusted technology partner that helps businesses grow through innovative and high-quality digital solutions.
                        </p>
                    </div>

                    {GROUPS.map((g) => (
                        <div key={g.title}>
                            <h4 className="text-sm font-semibold text-brand-text">{g.title}</h4>
                            <ul className="mt-4 space-y-3 text-sm text-brand-text-muted">
                                {g.links.map(([label, href]) => (
                                    <li key={label}>
                                        {href.startsWith('/') || href.startsWith('#') ? (
                                            <Link href={href} className={linkCls}>{label}</Link>
                                        ) : (
                                            <a href={href} className={linkCls}>{label}</a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div>
                        <h4 className="text-sm font-semibold text-brand-text">Contact Us</h4>
                        <ul className="mt-4 space-y-3 text-sm text-brand-text-muted">
                            <li><a href={`mailto:${CONTACT.email}`} className={linkCls}>{CONTACT.email}</a></li>
                            <li>{CONTACT.address}</li>
                            <li><a href={SITE} className={linkCls}>{CONTACT.website}</a></li>
                        </ul>
                        <p className="mt-6 text-sm font-semibold text-brand-text">Follow Us</p>
                        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-brand-text-muted">
                            {SOCIALS.map(([label, href]) => (
                                <li key={label}>
                                    <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>{label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-brand-border pt-6 text-xs text-brand-text-muted sm:flex-row sm:items-center">
                    <p>&copy; {new Date().getFullYear()} PT. Sapujagat Nirmana Tekna. All rights reserved.</p>
                    <div className="flex gap-5">
                        <a href={`${SITE}/privacy-policy`} className={linkCls}>Privacy</a>
                        <a href={`${SITE}/terms-of-service`} className={linkCls}>Terms</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}