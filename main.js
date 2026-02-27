// main.js

// Helper: safe localStorage
function safeStorage(key, value) {
  try {
    if (value === undefined) {
      return window.localStorage.getItem(key);
    }
    window.localStorage.setItem(key, value);
  } catch (e) {
    // stockage désactivé, on ignore
  }
}

/* ------------------------------
   Thème (clair / sombre)
--------------------------------- */
(function initTheme() {
  const saved = safeStorage("portfolio-theme");
  if (saved === "light") {
    document.body.classList.add("theme-light");
  } else if (saved === "dark") {
    document.body.classList.remove("theme-light");
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const toggleTheme = () => {
        document.body.classList.toggle("theme-light");
        const isLight = document.body.classList.contains("theme-light");
        safeStorage("portfolio-theme", isLight ? "light" : "dark");
      };

      if (!document.startViewTransition) {
        toggleTheme();
      } else {
        document.startViewTransition(() => toggleTheme());
      }
    });
  }

  /* ------------------------------
     Menu mobile
  --------------------------------- */
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.classList.toggle("open");
      siteNav.classList.toggle("open", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Fermer le menu après clic sur un lien
    siteNav.addEventListener("click", (e) => {
      if (e.target.matches(".nav-link")) {
        navToggle.classList.remove("open");
        siteNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ------------------------------
     Année dynamique (footer)
  --------------------------------- */
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  /* ------------------------------
     Scroll to top
  --------------------------------- */
  const scrollBtn = document.querySelector(".scroll-top");
  if (scrollBtn) {
    window.addEventListener("scroll", () => {
      const scrolled = window.scrollY || window.pageYOffset;
      if (scrolled > 420) {
        scrollBtn.classList.add("visible");
      } else {
        scrollBtn.classList.remove("visible");
      }
    });

    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ------------------------------
     Reveal on scroll (IntersectionObserver)
  --------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length > 0) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    // Fallback
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ------------------------------
     Filtres des projets (Work)
  --------------------------------- */
  const filterButtons = document.querySelectorAll(".filter-button");
  const projectCards = document.querySelectorAll(".project-card");

  if (filterButtons.length && projectCards.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter || "all";

        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        projectCards.forEach((card) => {
          const category = (card.dataset.category || "").split(" ");
          const match = filter === "all" || category.includes(filter);
          card.style.display = match ? "" : "none";
        });
      });
    });
  }

  /* ------------------------------
     Formulaire de contact (validation simple)
  --------------------------------- */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    const fields = ["name", "email", "message"];
    const errorEls = {};
    fields.forEach((field) => {
      const errorEl = contactForm.querySelector(`.field-error[data-for="${field}"]`);
      if (errorEl) errorEls[field] = errorEl;
    });
    const feedbackEl = contactForm.querySelector(".form-feedback");

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      // Reset erreurs
      Object.values(errorEls).forEach((el) => (el.textContent = ""));
      if (feedbackEl) feedbackEl.textContent = "";

      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();

      if (!name) {
        valid = false;
        if (errorEls.name) errorEls.name.textContent = "Merci d’indiquer ton nom.";
      }

      if (!email) {
        valid = false;
        if (errorEls.email) errorEls.email.textContent = "Merci d’indiquer ton email.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        valid = false;
        if (errorEls.email) errorEls.email.textContent = "L’email ne semble pas valide.";
      }

      if (!message || message.length < 10) {
        valid = false;
        if (errorEls.message) {
          errorEls.message.textContent =
            "Dis-m’en un peu plus sur ton projet (au moins 10 caractères).";
        }
      }

      if (!valid) {
        if (feedbackEl) {
          feedbackEl.textContent = "Le formulaire contient des erreurs.";
        }
        return;
      }

      // Simule un envoi (tu brancheras à un backend plus tard)
      if (feedbackEl) {
        feedbackEl.textContent =
          "Merci pour ton message ! Ce formulaire est une démo, mais tu peux m’écrire directement par email.";
      }
      contactForm.reset();
    });
  }

  /* ==================================
     AWWWARDS UI EXTENSIONS (JS)
     ================================== */

  // 1. Custom Cursor Logic
  // Only init on non-touch devices
  if (window.matchMedia("(pointer: fine)").matches) {
    // Forcefully remove native cursor
    const style = document.createElement('style');
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    const cursor = document.createElement("div");
    cursor.classList.add("custom-cursor");

    const cursorDot = document.createElement("div");
    cursorDot.classList.add("cursor-dot");
    cursor.appendChild(cursorDot);

    const cursorIcon = document.createElement("div");
    cursorIcon.classList.add("cursor-icon");
    cursor.appendChild(cursorIcon);

    document.body.appendChild(cursor);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Make cursor disappear when leaving window for robustness
    document.addEventListener("mouseleave", () => {
      cursor.style.display = "none";
    });
    document.addEventListener("mouseenter", () => {
      cursor.style.display = "flex";
    });

    // Animate cursor wrapper using transform
    const renderCursor = () => {
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;

      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    // Hover effect on links and buttons
    const interactiveElements = document.querySelectorAll("a, button, .project-card-overlay, .nav-toggle, .theme-toggle, .bento-proof-link, .bento-proof-compact");
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("hovering");

        // Contextual Icon/Text
        if (el.classList.contains("project-card-overlay") || el.closest('.project-card') || el.classList.contains('bento-proof-link') || el.classList.contains('comp-desc') || el.classList.contains('bento-proof-compact')) {
          cursor.classList.add("text-cursor");
          cursorIcon.innerHTML = 'VOIR';
        } else {
          cursor.classList.remove("text-cursor");
          // Use an empty string for typical links, just showing the empty circle inversion
          cursorIcon.innerHTML = '';
        }
      });

      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("hovering", "text-cursor");
        cursorIcon.innerHTML = '';
      });
    });
  }
});
