document.addEventListener("DOMContentLoaded", () => {

  const roleSelect = document.getElementById("role");
  const productorField = document.getElementById("productorField");
  const productorSelect = document.getElementById("id_productor");

  // Comprobar que los elementos existan
  if (!roleSelect || !productorField || !productorSelect) {
    return;
  }

  // Mostrar u ocultar el campo según el rol
  function actualizarFormulario() {

    const esProductor = roleSelect.value === "productor";

    productorField.style.display = esProductor ? "block" : "none";

    productorSelect.required = esProductor;

    productorSelect.disabled = !esProductor;
  }

  // Detectar cambios en el selector de rol
  roleSelect.addEventListener("change", actualizarFormulario);

  // Configurar el formulario cuando carga la página
  actualizarFormulario();

});
