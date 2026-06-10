import Swal from "sweetalert2";

export const getSwalConfig = () => {
  const isLight = document.body.classList.contains("light");
  return {
    background: isLight ? "#ffffff" : "#0f172a",
    color: isLight ? "#0f172a" : "#f8fafc",
    confirmButtonColor: "#ba8551",
    cancelButtonColor: "#64748b",
    buttonsStyling: false,
    customClass: {
      popup: "rounded-2xl border border-slate-800/80 shadow-2xl font-sans",
      title: "font-serif font-bold text-lg",
      htmlContainer: "text-xs font-medium text-slate-400",
      confirmButton: "px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg bg-amber-600 text-white",
      cancelButton: "px-5 py-2.5 rounded-xl font-bold text-xs shadow-md bg-slate-600 text-white",
    }
  };
};

export const showAlert = (title, text, icon = "info") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text,
    icon,
  });
};

export const showSuccess = (title, text) => {
  return showAlert(title, text, "success");
};

export const showError = (title, text) => {
  return showAlert(title, text, "error");
};

export const showConfirm = (title, text, confirmButtonText = "Yes, do it") => {
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
  });
};
