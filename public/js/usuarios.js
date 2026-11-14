document.addEventListener("DOMContentLoaded", () => {

  const roleSelect = document.getElementById("role");

  const productorField = document.getElementById("productorField");
  const productorSelect = document.getElementById("id_productor");

  const tecnicoField = document.getElementById("tecnicoField");
  const tecnicoSelect = document.getElementById("id_tecnico");

  if (
    !roleSelect ||
    !productorField ||
    !productorSelect ||
    !tecnicoField ||
    !tecnicoSelect
  ) {
    return;
  }

  function actualizarCampos() {

    const rol = roleSelect.value;

    productorField.style.display = "none";
    productorSelect.disabled = true;
    productorSelect.required = false;

    tecnicoField.style.display = "none";
    tecnicoSelect.disabled = true;
    tecnicoSelect.required = false;

    if (rol === "productor") {
      productorField.style.display = "";
      productorSelect.disabled = false;
      productorSelect.required = true;
    }

    if (rol === "tecnico") {
      tecnicoField.style.display = "";
      tecnicoSelect.disabled = false;
      tecnicoSelect.required = true;
    }
  }

  roleSelect.addEventListener("change", actualizarCampos);

  actualizarCampos();

});
