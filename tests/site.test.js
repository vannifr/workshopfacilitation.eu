const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SITE_DIR = path.join(__dirname, '..', 'public_html');

const NEW_PAGES = [
  'index.html',
  'for-teams.html',
  'for-facilitators.html',
  'methods.html',
  'about.html',
  'contact.html',
  'liberating-structures-facilitation.html',
  'open-space-technology.html',
  'lego-serious-play.html',
  'consent-decision-making.html',
  'visual-harvesting.html',
  'retrospectives.html',
  'flow-simulation.html',
  'lean-startup-simulation.html',
  'case-eu-agency-liberating-structures.html',
  'privacy.html',
  'legal.html',
  'open-space-facilitation.html',
];

// Pages with full content treatment (sticky CTA, trust signals etc.)
// Excludes utility pages like privacy and legal
const CONTENT_PAGES = NEW_PAGES.filter(
  (p) => !['privacy.html', 'legal.html'].includes(p)
);

const OLD_PAGES = [
  'why-us.html',
  'services.html',
  'how-we-work.html',
  'testimonials.html',
];

const METHODOLOGY_PAGES = [
  'liberating-structures-facilitation.html',
  'open-space-technology.html',
  'lego-serious-play.html',
  'consent-decision-making.html',
  'visual-harvesting.html',
  'retrospectives.html',
  'flow-simulation.html',
  'lean-startup-simulation.html',
];

const EXPECTED_NAV_ITEMS = [
  { href: 'index.html', text: 'Home' },
  { href: 'for-teams.html', text: 'For Teams' },
  { href: 'for-facilitators.html', text: 'For Facilitators' },
  { href: 'methods.html', text: 'Methods' },
  { href: 'about.html', text: 'About' },
];

const EXPECTED_NAV_CTA = { href: 'contact.html', text: 'Book a Call' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read and parse an HTML file, returning a Cheerio instance. */
function loadPage(filename) {
  const filepath = path.join(SITE_DIR, filename);
  assert.ok(
    fs.existsSync(filepath),
    `Expected page "${filename}" to exist at ${filepath}`
  );
  const html = fs.readFileSync(filepath, 'utf-8');
  return cheerio.load(html);
}

/** Return true when the file exists in SITE_DIR. */
function pageExists(filename) {
  return fs.existsSync(path.join(SITE_DIR, filename));
}

/** Collect all CSS files referenced via <link rel="stylesheet">. */
function getLinkedStylesheets($) {
  const sheets = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) sheets.push(href);
  });
  return sheets;
}

/** Return the page-level footer (direct child of body), not inline footers inside blockquotes. */
function getPageFooter($) {
  return $('body > footer').first();
}

// =========================================================================
// SEO TESTS
// =========================================================================

describe('SEO', () => {

  // --- H1 ---
  for (const page of NEW_PAGES) {
    it(`${page} has exactly one H1`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const h1Count = $('h1').length;
      assert.equal(
        h1Count,
        1,
        `${page}: expected exactly 1 <h1> but found ${h1Count}`
      );
    });
  }

  // --- Heading hierarchy ---
  for (const page of NEW_PAGES) {
    it(`${page} has valid heading hierarchy (no skipped levels)`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const headings = [];
      $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        headings.push(parseInt(el.tagName.replace('h', ''), 10));
      });
      assert.ok(headings.length > 0, `${page}: no headings found at all`);
      assert.equal(headings[0], 1, `${page}: first heading must be H1, got H${headings[0]}`);
      for (let i = 1; i < headings.length; i++) {
        const diff = headings[i] - headings[i - 1];
        assert.ok(
          diff <= 1,
          `${page}: heading level skipped from H${headings[i - 1]} to H${headings[i]} (heading #${i + 1})`
        );
      }
    });
  }

  // --- Unique non-empty <title> ---
  it('every page has a unique, non-empty <title>', () => {
    const titles = new Map();
    const missing = [];
    for (const page of NEW_PAGES) {
      if (!pageExists(page)) {
        missing.push(page);
        continue;
      }
      const $ = loadPage(page);
      const title = $('title').first().text().trim();
      if (!title) {
        missing.push(page);
      } else {
        if (titles.has(title)) {
          assert.fail(
            `Duplicate <title> "${title}" on "${page}" and "${titles.get(title)}"`
          );
        }
        titles.set(title, page);
      }
    }
    assert.equal(
      missing.length,
      0,
      `Pages with missing/empty <title>: ${missing.join(', ')}`
    );
  });

  // --- Title length ≤60 chars ---
  for (const page of NEW_PAGES) {
    it(`${page} — <title> is ≤60 characters`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const title = $('title').first().text().trim();
      assert.ok(
        title.length > 0,
        `${page}: <title> is empty`
      );
      assert.ok(
        title.length <= 60,
        `${page}: <title> is ${title.length} chars (max 60): "${title}"`
      );
    });
  }

  // --- Title contains brand name ---
  for (const page of NEW_PAGES) {
    it(`${page} — <title> contains brand name "Inclusive Dynamics"`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const title = $('title').first().text().trim();
      assert.ok(
        title.includes('Inclusive Dynamics'),
        `${page}: <title> does not contain "Inclusive Dynamics": "${title}"`
      );
    });
  }

  // --- Meta description exists ---
  for (const page of NEW_PAGES) {
    it(`${page} has a meta description`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const desc = $('meta[name="description"]').attr('content');
      assert.ok(
        desc && desc.trim().length > 0,
        `${page}: missing or empty <meta name="description">`
      );
    });
  }

  // --- Meta description length (50–160 chars) ---
  for (const page of NEW_PAGES) {
    it(`${page} — meta description is 50–160 characters`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const desc = ($('meta[name="description"]').attr('content') || '').trim();
      if (!desc) return; // covered by the exists test
      assert.ok(
        desc.length >= 50,
        `${page}: meta description too short (${desc.length} chars, min 50)`
      );
      assert.ok(
        desc.length <= 160,
        `${page}: meta description too long (${desc.length} chars, max 160): "${desc}"`
      );
    });
  }

  // --- Canonical URL exists ---
  for (const page of NEW_PAGES) {
    it(`${page} has a canonical URL`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const canonical = $('link[rel="canonical"]').attr('href');
      assert.ok(
        canonical && canonical.trim().length > 0,
        `${page}: missing <link rel="canonical">`
      );
    });
  }

  // --- Canonical is absolute HTTPS URL ---
  for (const page of NEW_PAGES) {
    it(`${page} — canonical URL is absolute HTTPS`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const canonical = ($('link[rel="canonical"]').attr('href') || '').trim();
      if (!canonical) return; // covered by exists test
      assert.ok(
        canonical.startsWith('https://'),
        `${page}: canonical URL must start with https://, got "${canonical}"`
      );
    });
  }

  // --- Open Graph tags ---
  for (const page of NEW_PAGES) {
    it(`${page} has Open Graph tags (og:title, og:description, og:image, og:url)`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const required = ['og:title', 'og:description', 'og:image', 'og:url'];
      const missing = required.filter((prop) => {
        const content = $(`meta[property="${prop}"]`).attr('content');
        return !content || content.trim().length === 0;
      });
      assert.equal(
        missing.length,
        0,
        `${page}: missing Open Graph tags: ${missing.join(', ')}`
      );
    });
  }

  // --- robots.txt ---
  it('robots.txt exists', () => {
    assert.ok(
      pageExists('robots.txt'),
      'robots.txt not found in public_html/'
    );
  });

  // --- sitemap.xml exists and is valid ---
  it('sitemap.xml exists and is valid XML', () => {
    assert.ok(
      pageExists('sitemap.xml'),
      'sitemap.xml not found in public_html/'
    );
    const xml = fs.readFileSync(path.join(SITE_DIR, 'sitemap.xml'), 'utf-8');
    assert.ok(
      xml.includes('<?xml') || xml.includes('<urlset'),
      'sitemap.xml does not look like valid XML (missing <?xml or <urlset)'
    );
    assert.ok(
      xml.includes('<urlset'),
      'sitemap.xml is missing <urlset> root element'
    );
    assert.ok(
      xml.includes('</urlset>'),
      'sitemap.xml is missing closing </urlset>'
    );
  });

  // --- sitemap.xml references all current pages ---
  it('sitemap.xml references all current pages', () => {
    if (!pageExists('sitemap.xml')) {
      assert.fail('sitemap.xml does not exist');
    }
    const xml = fs.readFileSync(path.join(SITE_DIR, 'sitemap.xml'), 'utf-8');
    const missing = NEW_PAGES.filter((page) => !xml.includes(page));
    assert.equal(
      missing.length,
      0,
      `sitemap.xml is missing references to: ${missing.join(', ')}`
    );
  });

  // --- No old pages in sitemap ---
  it('sitemap.xml does not reference old/removed pages', () => {
    if (!pageExists('sitemap.xml')) {
      assert.fail('sitemap.xml does not exist');
    }
    const xml = fs.readFileSync(path.join(SITE_DIR, 'sitemap.xml'), 'utf-8');
    const found = OLD_PAGES.filter((page) => xml.includes(page));
    assert.equal(
      found.length,
      0,
      `sitemap.xml still references old pages: ${found.join(', ')}`
    );
  });
});

// =========================================================================
// ACCESSIBILITY TESTS
// =========================================================================

describe('Accessibility', () => {

  // --- All images have alt ---
  for (const page of NEW_PAGES) {
    it(`${page} — all images have non-empty alt attributes`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const bad = [];
      $('img').each((_, el) => {
        const alt = $(el).attr('alt');
        if (alt === undefined || alt.trim() === '') {
          const src = $(el).attr('src') || '(unknown src)';
          bad.push(src);
        }
      });
      assert.equal(
        bad.length,
        0,
        `${page}: images missing alt text: ${bad.join(', ')}`
      );
    });
  }

  // --- Form inputs have labels ---
  for (const page of NEW_PAGES) {
    it(`${page} — all form inputs have associated labels`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const unlabeled = [];
      $('input, select, textarea').each((_, el) => {
        const $el = $(el);
        const type = ($el.attr('type') || '').toLowerCase();
        // hidden and submit inputs don't need labels
        if (type === 'hidden' || type === 'submit' || type === 'button') return;
        const id = $el.attr('id');
        const ariaLabel = $el.attr('aria-label');
        const ariaLabelledBy = $el.attr('aria-labelledby');
        const hasExplicitLabel = id && $(`label[for="${id}"]`).length > 0;
        const isWrappedInLabel = $el.closest('label').length > 0;
        if (!hasExplicitLabel && !isWrappedInLabel && !ariaLabel && !ariaLabelledBy) {
          unlabeled.push(id || $el.attr('name') || el.tagName);
        }
      });
      assert.equal(
        unlabeled.length,
        0,
        `${page}: form fields without labels: ${unlabeled.join(', ')}`
      );
    });
  }

  // --- Navigation has aria attributes ---
  for (const page of NEW_PAGES) {
    it(`${page} — navigation has aria attributes`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const nav = $('nav#primary-navigation');
      assert.ok(nav.length > 0, `${page}: no <nav id="primary-navigation"> found`);
      const ariaLabel = nav.attr('aria-label');
      const role = nav.attr('role');
      assert.ok(
        ariaLabel || role,
        `${page}: <nav id="primary-navigation"> has neither aria-label nor role attribute`
      );
    });
  }

  // --- Skip link ---
  for (const page of NEW_PAGES) {
    it(`${page} — skip link exists`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const skipLink = $('a[href="#main-content"], a[href="#main"], a.skip-link, a.skip-to-content');
      assert.ok(
        skipLink.length > 0,
        `${page}: no skip-to-content link found (expected a link to #main-content or #main, or an <a> with class skip-link)`
      );
    });
  }

  // --- lang attribute ---
  for (const page of NEW_PAGES) {
    it(`${page} — <html> has lang attribute`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const lang = $('html').attr('lang');
      assert.ok(
        lang && lang.trim().length > 0,
        `${page}: <html> is missing the lang attribute`
      );
    });
  }

  // --- Mobile nav toggle ---
  for (const page of NEW_PAGES) {
    it(`${page} — mobile nav toggle has aria-label and aria-expanded`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const toggle = $('button.nav-toggle, button.mobile-nav-toggle, button.hamburger, [data-nav-toggle], button[aria-controls="primary-navigation"]');
      assert.ok(
        toggle.length > 0,
        `${page}: no mobile navigation toggle button found`
      );
      if (toggle.length > 0) {
        const first = toggle.first();
        assert.ok(
          first.attr('aria-label'),
          `${page}: mobile nav toggle is missing aria-label`
        );
        assert.ok(
          first.attr('aria-expanded') !== undefined,
          `${page}: mobile nav toggle is missing aria-expanded`
        );
      }
    });
  }
});

// =========================================================================
// NAVIGATION TESTS
// =========================================================================

describe('Navigation', () => {

  // --- Primary navigation structure ---
  for (const page of NEW_PAGES) {
    it(`${page} — has correct primary navigation (5 items + CTA)`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const nav = $('nav#primary-navigation');
      assert.ok(nav.length > 0, `${page}: missing <nav id="primary-navigation">`);

      // Check the 5 nav items
      const navLinks = nav.find('ul > li > a');
      assert.equal(
        navLinks.length,
        EXPECTED_NAV_ITEMS.length,
        `${page}: expected ${EXPECTED_NAV_ITEMS.length} nav items but found ${navLinks.length}`
      );
      navLinks.each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        assert.equal(
          href,
          EXPECTED_NAV_ITEMS[i].href,
          `${page}: nav item #${i + 1} href is "${href}", expected "${EXPECTED_NAV_ITEMS[i].href}"`
        );
        assert.equal(
          text,
          EXPECTED_NAV_ITEMS[i].text,
          `${page}: nav item #${i + 1} text is "${text}", expected "${EXPECTED_NAV_ITEMS[i].text}"`
        );
      });
    });
  }

  // --- Book a Call CTA in nav ---
  for (const page of NEW_PAGES) {
    it(`${page} — has "Book a Call" CTA in nav`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const nav = $('nav#primary-navigation');
      const cta = nav.find('a.btn.nav-cta, a.nav-cta');
      assert.ok(cta.length > 0, `${page}: no CTA button found in nav`);
      const ctaText = cta.first().text().trim();
      assert.equal(
        ctaText,
        EXPECTED_NAV_CTA.text,
        `${page}: nav CTA text is "${ctaText}", expected "${EXPECTED_NAV_CTA.text}"`
      );
      const ctaHref = cta.first().attr('href');
      assert.equal(
        ctaHref,
        EXPECTED_NAV_CTA.href,
        `${page}: nav CTA href is "${ctaHref}", expected "${EXPECTED_NAV_CTA.href}"`
      );
    });
  }

  // --- Footer consistency ---
  it('footer navigation is consistent across all pages', () => {
    const footers = new Map();
    const missing = [];
    for (const page of NEW_PAGES) {
      if (!pageExists(page)) {
        missing.push(page);
        continue;
      }
      const $ = loadPage(page);
      const footer = getPageFooter($); // uses body > footer to avoid blockquote footers
      if (footer.length === 0) {
        missing.push(page);
        continue;
      }
      // Collect footer link hrefs as a fingerprint
      const links = [];
      footer.find('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) links.push(href);
      });
      footers.set(page, links.join('|'));
    }
    assert.equal(missing.length, 0, `Pages missing footer: ${missing.join(', ')}`);
    const uniqueFooters = new Set(footers.values());
    assert.equal(
      uniqueFooters.size,
      1,
      `Footer navigation differs across pages. Found ${uniqueFooters.size} distinct footers.`
    );
  });

  // --- No broken internal links ---
  it('no broken internal links across all pages', () => {
    const broken = [];
    for (const page of NEW_PAGES) {
      if (!pageExists(page)) continue;
      const $ = loadPage(page);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        // Skip external links, anchors, mailto, tel, javascript
        if (
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.startsWith('#') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:')
        ) {
          return;
        }
        // Strip query string and fragment
        const cleanHref = href.split('?')[0].split('#')[0];
        if (!cleanHref) return;
        const target = path.join(SITE_DIR, cleanHref);
        if (!fs.existsSync(target)) {
          broken.push(`${page} -> ${href}`);
        }
      });
    }
    assert.equal(
      broken.length,
      0,
      `Broken internal links found:\n  ${broken.join('\n  ')}`
    );
  });
});

// =========================================================================
// CONTENT TESTS
// =========================================================================

describe('Content', () => {

  it('homepage has a social proof / trust section', () => {
    if (!pageExists('index.html')) {
      assert.fail('index.html does not exist yet');
    }
    const $ = loadPage('index.html');
    const html = $.html().toLowerCase();
    // Look for common trust indicators
    const hasTrustSection =
      html.includes('social-proof') ||
      html.includes('trust') ||
      html.includes('testimonial') ||
      html.includes('client') ||
      html.includes('partner') ||
      html.includes('logo') ||
      html.includes('as seen') ||
      html.includes('trusted by') ||
      html.includes('worked with') ||
      $('[class*="trust"], [class*="social-proof"], [class*="clients"], [class*="partners"], [class*="testimonial"], [id*="trust"], [id*="social-proof"]').length > 0;
    assert.ok(
      hasTrustSection,
      'index.html: no social proof or trust section found (looked for classes/ids containing "trust", "social-proof", "clients", "testimonial", etc.)'
    );
  });

  it('contact page has a visible phone number', () => {
    if (!pageExists('contact.html')) {
      assert.fail('contact.html does not exist yet');
    }
    const $ = loadPage('contact.html');
    const html = $.html();
    // Look for tel: links or phone number patterns
    const hasTelLink = $('a[href^="tel:"]').length > 0;
    const hasPhonePattern = /(\+?\d[\d\s\-().]{7,})/.test(html);
    assert.ok(
      hasTelLink || hasPhonePattern,
      'contact.html: no visible phone number found (expected a tel: link or phone number pattern)'
    );
  });

  it('about page contains testimonials or case studies', () => {
    if (!pageExists('about.html')) {
      assert.fail('about.html does not exist yet');
    }
    const $ = loadPage('about.html');
    const html = $.html().toLowerCase();
    const hasTestimonials =
      html.includes('testimonial') ||
      html.includes('case stud') ||
      html.includes('review') ||
      html.includes('quote') ||
      html.includes('blockquote') ||
      $('blockquote').length > 0 ||
      $('[class*="testimonial"], [class*="case-stud"], [class*="review"]').length > 0;
    assert.ok(
      hasTestimonials,
      'about.html: no testimonials or case studies section found'
    );
  });

  // --- Methodology pages link back to methods.html ---
  for (const page of METHODOLOGY_PAGES) {
    it(`${page} links back to methods.html hub`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const linksToHub = $('a[href="methods.html"], a[href="./methods.html"], a[href="/methods.html"]');
      assert.ok(
        linksToHub.length > 0,
        `${page}: no link back to methods.html hub page found`
      );
    });
  }

  // --- Sticky CTA on all content pages ---
  for (const page of CONTENT_PAGES) {
    it(`${page} — has sticky CTA (#sticky-cta)`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      assert.ok(
        $('#sticky-cta').length > 0,
        `${page}: no #sticky-cta element found`
      );
    });
  }

  // --- No content placeholders in page text ---
  for (const page of NEW_PAGES) {
    it(`${page} — no content placeholders in text`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      // Check visible text for placeholder patterns
      const bodyText = $('body').text();
      const placeholderPatterns = [
        /\[QUOTE\s+PLACEHOLDER/i,
        /\[TODO/i,
        /\[PLACEHOLDER/i,
        /\[COMING\s+SOON/i,
        /\[FIXME/i,
        /\[VAT\s+PLACEHOLDER/i,
        /\[INSERT/i,
        /\[TBD/i,
        /\[TO\s+BE\s+(ADDED|FILLED|REPLACED)/i,
      ];
      const found = [];
      for (const pattern of placeholderPatterns) {
        const match = bodyText.match(pattern);
        if (match) found.push(match[0]);
      }
      assert.equal(
        found.length,
        0,
        `${page}: content placeholders found in page text: ${found.join(', ')}`
      );
    });
  }

  // --- No placeholder HTML comments ---
  for (const page of NEW_PAGES) {
    it(`${page} — no placeholder HTML comments`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const html = fs.readFileSync(path.join(SITE_DIR, page), 'utf-8');
      const placeholderPatterns = [
        /<!--.*will go here later.*-->/i,
        /<!--.*todo.*-->/i,
        /<!--.*placeholder.*-->/i,
        /<!--.*coming soon.*-->/i,
        /<!--.*fixme.*-->/i,
        /<!--.*temp.*-->/i,
      ];
      const found = [];
      for (const pattern of placeholderPatterns) {
        const match = html.match(pattern);
        if (match) {
          found.push(match[0]);
        }
      }
      assert.equal(
        found.length,
        0,
        `${page}: placeholder comments found: ${found.join(', ')}`
      );
    });
  }
});

// =========================================================================
// PERFORMANCE TESTS
// =========================================================================

describe('Performance', () => {

  // --- Lazy loading for below-fold images ---
  for (const page of NEW_PAGES) {
    it(`${page} — below-fold images have loading="lazy"`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const images = $('img');
      if (images.length <= 1) return; // Only hero image, nothing below fold
      const belowFold = [];
      images.each((i, el) => {
        if (i === 0) return; // Skip first image (likely above fold / hero)
        const loading = $(el).attr('loading');
        if (loading !== 'lazy') {
          belowFold.push($(el).attr('src') || `(image #${i + 1})`);
        }
      });
      assert.equal(
        belowFold.length,
        0,
        `${page}: below-fold images missing loading="lazy": ${belowFold.join(', ')}`
      );
    });
  }

  // --- Images have width and height (prevents CLS) ---
  for (const page of NEW_PAGES) {
    it(`${page} — all images have width and height attributes`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const missing = [];
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src') || '';
        if (src.startsWith('data:')) return;
        const hasWidth = $(el).attr('width') !== undefined;
        const hasHeight = $(el).attr('height') !== undefined;
        if (!hasWidth || !hasHeight) {
          missing.push(src);
        }
      });
      assert.equal(
        missing.length,
        0,
        `${page}: images missing width/height attributes (causes layout shift): ${missing.join(', ')}`
      );
    });
  }

  // --- Image files exist on disk ---
  for (const page of NEW_PAGES) {
    it(`${page} — all referenced image files exist`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const missing = [];
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src') || '';
        if (!src || src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return;
        const imgPath = path.join(SITE_DIR, src);
        if (!fs.existsSync(imgPath)) {
          missing.push(src);
        }
      });
      assert.equal(
        missing.length,
        0,
        `${page}: image files not found on disk: ${missing.join(', ')}`
      );
    });
  }

  // --- WebP images ---
  for (const page of NEW_PAGES) {
    it(`${page} — all images use WebP format`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const nonWebP = [];
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (!src) return;
        // Skip SVGs and data URIs
        if (src.endsWith('.svg') || src.startsWith('data:')) return;
        if (!src.endsWith('.webp')) {
          nonWebP.push(src);
        }
      });
      // Also check <source> in <picture> elements
      $('source[srcset]').each((_, el) => {
        const srcset = $(el).attr('srcset');
        if (!srcset) return;
        const urls = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]);
        for (const url of urls) {
          if (url.endsWith('.svg') || url.startsWith('data:')) continue;
          if (!url.endsWith('.webp')) {
            nonWebP.push(url);
          }
        }
      });
      assert.equal(
        nonWebP.length,
        0,
        `${page}: non-WebP images found: ${nonWebP.join(', ')}`
      );
    });
  }

  // --- prefers-reduced-motion ---
  it('CSS includes prefers-reduced-motion media query', () => {
    const cssDir = path.join(SITE_DIR, 'css');
    assert.ok(fs.existsSync(cssDir), 'css/ directory not found');
    const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
    assert.ok(cssFiles.length > 0, 'No CSS files found in css/ directory');
    let found = false;
    for (const file of cssFiles) {
      const css = fs.readFileSync(path.join(cssDir, file), 'utf-8');
      if (css.includes('prefers-reduced-motion')) {
        found = true;
        break;
      }
    }
    assert.ok(
      found,
      'No CSS file contains a prefers-reduced-motion media query'
    );
  });
});

// =========================================================================
// TECHNICAL TESTS
// =========================================================================

describe('Technical', () => {

  // --- Schema.org JSON-LD ---
  for (const page of NEW_PAGES) {
    it(`${page} — has schema.org JSON-LD`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const jsonLd = $('script[type="application/ld+json"]');
      assert.ok(
        jsonLd.length > 0,
        `${page}: no <script type="application/ld+json"> found`
      );
      // Verify it parses as JSON
      jsonLd.each((i, el) => {
        const content = $(el).html();
        try {
          JSON.parse(content);
        } catch (e) {
          assert.fail(`${page}: JSON-LD block #${i + 1} is not valid JSON: ${e.message}`);
        }
      });
    });
  }

  // --- No duplicate schema blocks ---
  for (const page of NEW_PAGES) {
    it(`${page} — no duplicate schema.org blocks`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const jsonLd = $('script[type="application/ld+json"]');
      if (jsonLd.length <= 1) return; // 0 or 1 = no duplicates possible
      const types = [];
      jsonLd.each((_, el) => {
        try {
          const data = JSON.parse($(el).html());
          const type = data['@type'] || JSON.stringify(data).substring(0, 80);
          types.push(type);
        } catch {
          // Invalid JSON — caught by the other test
        }
      });
      const seen = new Set();
      const dupes = [];
      for (const t of types) {
        if (seen.has(t)) dupes.push(t);
        seen.add(t);
      }
      assert.equal(
        dupes.length,
        0,
        `${page}: duplicate schema.org @type found: ${dupes.join(', ')}`
      );
    });
  }

  // --- External links have rel="noopener noreferrer" ---
  for (const page of NEW_PAGES) {
    it(`${page} — external links have rel="noopener noreferrer"`, () => {
      if (!pageExists(page)) {
        assert.fail(`Page "${page}" does not exist yet`);
      }
      const $ = loadPage(page);
      const insecure = [];
      $('a[href^="http"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        // Skip same-site links
        if (href.includes('workshopfacilitation.eu')) return;
        const rel = ($(el).attr('rel') || '').toLowerCase();
        if (!rel.includes('noopener') || !rel.includes('noreferrer')) {
          insecure.push(href);
        }
      });
      assert.equal(
        insecure.length,
        0,
        `${page}: external links missing rel="noopener noreferrer": ${insecure.join(', ')}`
      );
    });
  }

  // --- All pages reference the same CSS file ---
  it('all pages reference the same CSS file', () => {
    const sheetsByPage = new Map();
    const missing = [];
    for (const page of NEW_PAGES) {
      if (!pageExists(page)) {
        missing.push(page);
        continue;
      }
      const $ = loadPage(page);
      const sheets = getLinkedStylesheets($);
      sheetsByPage.set(page, sheets.join('|'));
    }
    if (missing.length > 0) {
      assert.fail(`Pages not found (cannot check CSS): ${missing.join(', ')}`);
    }
    const uniqueSheetSets = new Set(sheetsByPage.values());
    assert.equal(
      uniqueSheetSets.size,
      1,
      `Pages reference different CSS files. Distinct sets: ${[...uniqueSheetSets].map((s) => `[${s}]`).join(' vs ')}`
    );
  });

  // --- Old pages should be redirect stubs ---
  for (const page of OLD_PAGES) {
    it(`old page "${page}" is a redirect stub`, () => {
      if (!pageExists(page)) return; // Not existing is also fine
      const $ = loadPage(page);
      const metaRefresh = $('meta[http-equiv="refresh"]');
      assert.ok(
        metaRefresh.length > 0,
        `Old page "${page}" exists but is NOT a redirect (missing meta refresh)`
      );
    });
  }

  // --- No dead href="#" links ---
  for (const page of NEW_PAGES) {
    it(`${page} — no dead href="#" links`, () => {
      if (!pageExists(page)) return;
      const $ = loadPage(page);
      const dead = [];
      $('a[href="#"]').each((_, el) => {
        dead.push($(el).text().trim().substring(0, 50));
      });
      assert.equal(
        dead.length,
        0,
        `${page}: dead href="#" links found: ${dead.join(', ')}`
      );
    });
  }

  // --- Favicon on all pages ---
  for (const page of NEW_PAGES) {
    it(`${page} — has favicon link`, () => {
      if (!pageExists(page)) return;
      const $ = loadPage(page);
      const favicon = $('link[rel="icon"]');
      assert.ok(
        favicon.length > 0,
        `${page}: no <link rel="icon"> found`
      );
    });
  }

  // --- No plain-text phone numbers in HTML body ---
  for (const page of NEW_PAGES) {
    it(`${page} — no plain-text phone numbers in body`, () => {
      if (!pageExists(page)) return;
      const $ = loadPage(page);
      const bodyHtml = $('main').html() || '';
      // Remove script tags content
      const htmlNoScript = bodyHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      // Check for phone number patterns in visible HTML
      const phonePattern = /\+32[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}/;
      const match = htmlNoScript.match(phonePattern);
      assert.ok(
        !match,
        `${page}: plain-text phone number found in body HTML: "${match?.[0]}". Use JS rendering for anti-scraping.`
      );
    });
  }

  // --- No plain-text email addresses in HTML body ---
  for (const page of NEW_PAGES) {
    it(`${page} — no plain-text email addresses in body`, () => {
      if (!pageExists(page)) return;
      const $ = loadPage(page);
      const bodyHtml = $('main').html() || '';
      const htmlNoScript = bodyHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const match = htmlNoScript.match(emailPattern);
      assert.ok(
        !match,
        `${page}: plain-text email found in body HTML: "${match?.[0]}". Obfuscate or remove.`
      );
    });
  }

  // --- Personal names in alt attributes ---
  for (const page of NEW_PAGES) {
    it(`${page} — no full personal names in image alt text`, () => {
      if (!pageExists(page)) return;
      const $ = loadPage(page);
      const bad = [];
      const namePatterns = [/Vandaele/i, /Vannieuwenhuyse/i];
      $('img').each((_, el) => {
        const alt = $(el).attr('alt') || '';
        for (const p of namePatterns) {
          if (p.test(alt)) {
            bad.push(alt);
          }
        }
      });
      assert.equal(
        bad.length,
        0,
        `${page}: personal names in alt text (scraping risk): ${bad.join(', ')}`
      );
    });
  }

  // --- Method Finder wizard exists on methods page ---
  it('methods.html has Method Finder wizard', () => {
    if (!pageExists('methods.html')) return;
    const $ = loadPage('methods.html');
    assert.ok(
      $('#finder-wizard').length > 0,
      'methods.html: #finder-wizard not found'
    );
    assert.ok(
      $('.finder-option').length >= 5,
      'methods.html: finder wizard has too few options'
    );
  });
});
