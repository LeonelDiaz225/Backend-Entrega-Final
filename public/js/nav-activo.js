document.addEventListener("DOMContentLoaded", () => {
  const rutaActual = window.location.pathname;
  const enlaces = document.querySelectorAll(".main-nav a");

  enlaces.forEach((enlace) => {
    const rutaEnlace = new URL(enlace.href).pathname;

    const estaActivo =
      rutaEnlace === "/"
        ? rutaActual === "/"
        : rutaActual === rutaEnlace ||
          rutaActual.startsWith(rutaEnlace + "/");

    if (estaActivo) {
      enlace.setAttribute("aria-current", "page");
    } else {
      enlace.removeAttribute("aria-current");
    }
  });
});
