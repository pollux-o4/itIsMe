let dispose = () => {};
function initializeStory() {
  dispose();
  if (!document.querySelector(".story-body")) return;
  const controller = new AbortController();
  const { signal } = controller;
  const navLinks = [
    ...document.querySelectorAll<HTMLAnchorElement>(".story-nav a"),
  ];
  const sections = [
    ...document.querySelectorAll<HTMLElement>("[data-chapter]"),
  ];
  let frame = 0;
  let activeId = "";
  function updateLocation() {
    // A chapter remains current while its start is in the upper reading area.
    // Expanding a card can shift its section below a fixed pixel threshold.
    const readingEdge = Math.max(140, window.innerHeight * 0.25);
    const active =
      sections
        .filter((section) => section.getBoundingClientRect().top <= readingEdge)
        .at(-1) || sections[0];
    const nav = document.querySelector<HTMLElement>(".story-nav");
    const current = navLinks.find((link) => link.hash === `#${active?.id}`);
    if (
      activeId !== active?.id &&
      nav &&
      current &&
      nav.scrollWidth > nav.clientWidth
    ) {
      nav.scrollTo({
        left:
          current.offsetLeft - nav.clientWidth / 2 + current.offsetWidth / 2,
        behavior: "instant",
      });
    }
    activeId = active?.id || "";
    navLinks.forEach((link) => {
      if (link.hash === `#${active?.id}`)
        link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  window.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateLocation);
    },
    { passive: true, signal },
  );
  window.addEventListener("resize", updateLocation, { signal });
  // Anchor navigation stays native; focus follows the destination for keyboard readers.
  document
    .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    .forEach((link) => {
      // Keep chapter jumps native so the router does not reset destination focus.
      link.dataset.astroReload = "";
      link.addEventListener(
        "click",
        () => {
          const target = document.getElementById(link.hash.slice(1));
          if (target) {
            target.tabIndex = -1;
            target.focus({ preventScroll: true });
          }
        },
        { signal },
      );
    });
  const preview = document.querySelector<HTMLElement>(".project-preview");
  const panels = [...document.querySelectorAll<HTMLAnchorElement>("[data-preview]")];
  const cards = [...document.querySelectorAll<HTMLAnchorElement>(".story-map .map-card")];
  const previewMedia = matchMedia("(min-width:800px) and (hover:hover) and (pointer:fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  function selectPreview(id: string) {
    panels.forEach(panel => {
      const active = panel.dataset.preview === id;
      panel.toggleAttribute("data-active", active);
      panel.inert = !active;
      panel.setAttribute("aria-hidden", String(!active));
    });
    cards.forEach(card => card.toggleAttribute("data-preview-active", card.hash === `#${id}`));
    preview?.removeAttribute("style");
  }
  cards.forEach(card => {
    card.addEventListener("pointerenter", event => {
      if (previewMedia.matches && event.pointerType === "mouse") selectPreview(card.hash.slice(1));
    }, {signal});
    card.addEventListener("focusin", () => {
      if (previewMedia.matches && card.matches(":focus-visible")) selectPreview(card.hash.slice(1));
    }, {signal});
    card.addEventListener("pointermove", event => {
      if (!preview || !previewMedia.matches || reducedMotion.matches || event.pointerType !== "mouse") return;
      const rect = card.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      preview.style.setProperty("--preview-x", `${x * 6}px`);
      preview.style.setProperty("--preview-tilt", `${x * 1.2}deg`);
    }, {signal});
    card.addEventListener("pointerleave", () => preview?.removeAttribute("style"), {signal});
  });
  previewMedia.addEventListener("change", () => selectPreview("nutrition"), {signal});
  reducedMotion.addEventListener("change", () => preview?.removeAttribute("style"), {signal});
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") selectPreview("nutrition");
  }, {signal});
  const details = [
    ...document.querySelectorAll<HTMLDetailsElement>("[data-disclosure]"),
  ];
  let beforePrint: boolean[] | null = null;
  let beforePreview = "nutrition";
  function expandForPrint() {
    if (beforePrint) return;
    beforePrint = details.map((d) => d.open);
    beforePreview = document.querySelector<HTMLElement>("[data-preview][data-active]")?.dataset.preview || "nutrition";
    selectPreview("nutrition");
    details.forEach((d) => {
      d.open = true;
    });
  }
  function restoreAfterPrint() {
    if (!beforePrint) return;
    details.forEach((d, i) => {
      d.open = beforePrint![i];
    });
    beforePrint = null;
    selectPreview(beforePreview);
  }
  window.addEventListener("beforeprint", expandForPrint, { signal });
  window.addEventListener("afterprint", restoreAfterPrint, { signal });
  document
    .querySelectorAll<HTMLButtonElement>("[data-print]")
    .forEach((button) =>
      button.addEventListener(
        "click",
        async () => {
          await document.fonts.ready;
          await Promise.all(
            [...document.images].map((image) => image.decode().catch(() => {})),
          );
          window.print();
        },
        { signal },
      ),
    );
  function openHash() {
    const target = document.getElementById(location.hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  }
  window.addEventListener("hashchange", openHash, { signal });
  openHash();
  updateLocation();
  dispose = () => {
    controller.abort();
    cancelAnimationFrame(frame);
  };
}
document.addEventListener("astro:page-load", initializeStory);
document.addEventListener("astro:before-swap", () => dispose());
