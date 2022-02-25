const imgElements = document.querySelectorAll("img[data-src]");

const lazyLoadingImage = (entries, observer) => {
 entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  entry.target.src = entry.target.dataset.src;
  entry.target.addEventListener("load", () => {
   entry.target.classList.remove("lazy-img");
   observer.unobserve(entry.target);
  });
 });
};
const lazyLoadingObserver = new IntersectionObserver(lazyLoadingImage, {
 threshold: 0.1,
});
imgElements.forEach((img) => lazyLoadingObserver.observe(img));