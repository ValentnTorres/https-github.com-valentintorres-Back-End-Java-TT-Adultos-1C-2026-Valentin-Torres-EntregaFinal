// Login contra /api/auth/login. El registro de cuentas no esta aca:
// es crearUsuario() en usuariosApi.js, que ya manda nombre+email+password.
import { apiFetch, guardarSesion } from "./config";

export async function iniciarSesion({ email, password }) {
  const respuesta = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const { token, ...usuario } = respuesta;
  guardarSesion({ token, usuario });
  return usuario;
}
