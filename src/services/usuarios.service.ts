/**
 * ARCHIVO: usuarios.service.ts
 * PROPÓSITO: Este archivo actúa como nuestro "mensajero". 
 * Su única responsabilidad es comunicarse con el backend (NestJS) usando AXIOS.
 * Como notarás, Axios simplifica mucho el código en comparación con fetch.
 */

// 1. IMPORTACIONES
// Importamos axios (previamente lo instalamos con 'npm install axios')
import axios from 'axios';

// Esta es la URL base donde nuestro backend de NestJS está escuchando las peticiones.
const API_URL = 'http://localhost:3000/usuarios';

export const usuariosService = {
  
  // 1. OBTENER TODOS (GET)
  async getAll() {
    // Axios hace la petición y automáticamente convierte la respuesta JSON en un objeto de JavaScript.
    // Además, si hay un error HTTP (ej. 404 o 500), Axios lanza una excepción automáticamente.
    const respuesta = await axios.get(API_URL);
    // Toda la información útil viene dentro de la propiedad '.data'
    return respuesta.data;
  },

  // 2. OBTENER UNO SOLO (GET por ID)
  async getById(id: number) {
    const respuesta = await axios.get(`${API_URL}/${id}`);
    return respuesta.data;
  },

  // 3. CREAR USUARIO (POST)
  async create(datosUsuario: any) {
    // Para enviar datos, simplemente le pasamos nuestro objeto 'datosUsuario' como segundo parámetro.
    // ¡Adiós a JSON.stringify() y a los headers manuales! Axios lo hace todo por debajo.
    const respuesta = await axios.post(API_URL, datosUsuario);
    return respuesta.data;
  },

  // 4. ACTUALIZAR USUARIO (PATCH)
  async update(id: number, datosParciales: any) {
    const respuesta = await axios.patch(`${API_URL}/${id}`, datosParciales);
    return respuesta.data;
  },

  // 5. ELIMINAR USUARIO (DELETE)
  async remove(id: number) {
    const respuesta = await axios.delete(`${API_URL}/${id}`);
    return respuesta.data;
  }
};
