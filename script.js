const categoryButtons = document.querySelectorAll(".category");
const productCards = document.querySelectorAll(".product-card");

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.category;

    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    productCards.forEach((card) => {
      const cardCategories = card.dataset.category;

      if (selectedCategory === "todos" || cardCategories.includes(selectedCategory)) {
        card.style.display = "block";

        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, 20);
      } else {
        card.style.opacity = "0";
        card.style.transform = "translateY(14px)";

        setTimeout(() => {
          card.style.display = "none";
        }, 180);
      }
    });
  });
});