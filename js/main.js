/* Page behaviour: footer year and gentle scroll reveal. */
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const items = document.querySelectorAll(".reveal");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || calm) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  items.forEach((el) => io.observe(el));
  document
    .getElementById("email-copy-btn")
    .addEventListener("click", function (e) {
      // 1. Extract the clean email address from the href attribute
      const hrefValue = this.getAttribute("href");
      const emailAddress = hrefValue.replace("mailto:", "");

      // 2. Use the Clipboard API to copy the email string
      navigator.clipboard
        .writeText(emailAddress)
        .then(() => {
          // 3. Select the message placeholder and set the text
          const messageSpan = document.getElementById("copy-message");
          messageSpan.textContent = "Copied to clipboard!";
          messageSpan.style.display = "inline";

          // 4. Hide the message automatically after 2 seconds
          setTimeout(() => {
            messageSpan.style.display = "none";
          }, 2000);
        })
        .catch((err) => {
          console.error("Could not copy email: ", err);
        });
    });
})();
