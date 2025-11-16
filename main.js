console.log("main.js loaded — hybrid ticker mode active");

// Fixed celebration ticker text
const tickerTxt = document.querySelector(".ticker span");
if (tickerTxt) {
  tickerTxt.textContent =
    "🎉 Cheers to GreenLeaf Café on their anniversary! 💍 Congrats to Emma & Tom on their wedding! 🎂 Happy Birthday to Sarah! 🍼 Welcome baby James! 🥇 Congrats Team WAJ for community award! 🌿 Support local businesses making Jersey greener! 💖 Advertise your celebrations here – contact us today!";
}

// News feed (kept separate)
const newsDiv = document.getElementById("news");
let active = "jersey";

async function fetchAndRender(scope = active) {
  active = scope;
  console.log("fetchAndRender called for", scope);
  try {
    const res = await fetch(`/api/news?scope=${scope}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items || [];
    const ul = document.createElement("ul");
    items.forEach(it => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = it.link;
      a.target = "_blank";
      a.textContent = `${it.title} — ${it.pubDate || ""}`;
      li.appendChild(a);
      ul.appendChild(li);
    });
    newsDiv.innerHTML = "";
    newsDiv.appendChild(ul);
  } catch (err) {
    console.error("fetch error", err);
    newsDiv.innerHTML = "<p>Could not load news.</p>";
  }
}

// Button bindings
document.querySelectorAll("button[data-scope]").forEach(btn => {
  btn.addEventListener("click", () => fetchAndRender(btn.dataset.scope));
});
document.getElementById("refresh")?.addEventListener("click", () => {
  console.log("Ticker reset + news reload");
  location.reload();
});
document.getElementById("calculator")?.addEventListener("click", () => {
  window.location.href = "/calc.html";
});

// Run once
fetchAndRender("jersey");
