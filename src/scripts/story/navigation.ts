export function initializeNavigation(signal: AbortSignal) {
    const navLinks = [
        ...document.querySelectorAll<HTMLAnchorElement>(".story-nav a"),
    ];
    const sections = [
        ...document.querySelectorAll<HTMLElement>("[data-chapter]"),
    ];
    const nav = document.querySelector<HTMLElement>(".story-nav");
    const masthead = document.querySelector<HTMLElement>(".masthead");
    const progress = document.querySelector<HTMLElement>(".reading-progress span");
    let lastScrollY = window.scrollY;
    let directionStartY = lastScrollY;
    let direction = 0;
    let frame = 0;
    let activeId = "";
    function updateLocation() {
        if (progress) {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const fraction = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
            progress.style.transform = `scaleX(${fraction})`;
        }
        // A chapter remains current while its start is in the upper reading area.
        // Expanding a card can shift its section below a fixed pixel threshold.
        const readingEdge = Math.max(140, window.innerHeight * 0.25);
        const active = sections
            .filter((section) => section.getBoundingClientRect().top <= readingEdge)
            .at(-1) || sections[0];
        const current = navLinks.find((link) => link.hash === `#${active?.id}`);
        if (activeId !== active?.id &&
            nav &&
            current &&
            nav.scrollWidth > nav.clientWidth) {
            nav.scrollTo({
                left: current.offsetLeft - nav.clientWidth / 2 + current.offsetWidth / 2,
                behavior: "instant",
            });
        }
        activeId = active?.id || "";
        // The masthead reads against whichever chapter sits beneath it.
        const beneath = sections.find((section) => {
            const rect = section.getBoundingClientRect();
            return rect.top <= 32 && rect.bottom > 32;
        });
        masthead?.classList.toggle("on-night", Boolean(beneath?.classList.contains("is-night")));
        masthead?.classList.toggle("is-scrolled", window.scrollY > 24);
        navLinks.forEach((link) => {
            if (link.hash === `#${active?.id}`)
                link.setAttribute("aria-current", "location");
            else
                link.removeAttribute("aria-current");
        });
    }
    window.addEventListener("scroll", () => {
        const y = Math.max(0, window.scrollY);
        const nextDirection = Math.sign(y - lastScrollY);
        if (nextDirection && nextDirection !== direction) {
            direction = nextDirection;
            directionStartY = lastScrollY;
        }
        // Wide screens keep the chapter list in view while reading (SPEC 2.10).
        if (masthead && window.matchMedia("(max-width: 1099px)").matches) {
            if (y < 120 || (direction < 0 && directionStartY - y >= 12)) {
                masthead.classList.remove("is-scroll-hidden");
            } else if (direction > 0 && y - directionStartY >= 24 && !masthead.contains(document.activeElement)) {
                masthead.classList.add("is-scroll-hidden");
            }
        }
        lastScrollY = y;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(updateLocation);
    }, { passive: true, signal });
    window.addEventListener("resize", () => {
        masthead?.classList.remove("is-scroll-hidden");
        lastScrollY = directionStartY = window.scrollY;
        direction = 0;
        updateLocation();
    }, { signal });
    masthead?.addEventListener("focusin", () => masthead.classList.remove("is-scroll-hidden"), { signal });
    document.addEventListener("toggle", updateLocation, { capture: true, signal });
    // Anchor navigation stays native; focus follows the destination for keyboard readers.
    document
        .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
        .forEach((link) => {
        // Keep chapter jumps native so the router does not reset destination focus.
        link.dataset.astroReload = "";
        link.addEventListener("click", () => {
            const target = document.getElementById(link.hash.slice(1));
            if (target) {
                target.tabIndex = -1;
                target.focus({ preventScroll: true });
            }
        }, { signal });
    });
    function openHash() {
        const target = document.getElementById(location.hash.slice(1));
        if (target instanceof HTMLDetailsElement)
            target.open = true;
    }
    window.addEventListener("hashchange", openHash, { signal });
    openHash();
    updateLocation();
    signal.addEventListener("abort", () => { cancelAnimationFrame(frame); masthead?.classList.remove("is-scroll-hidden"); }, { once: true });
}
