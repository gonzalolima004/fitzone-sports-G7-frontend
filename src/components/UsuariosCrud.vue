<!-- 
  ARCHIVO: UsuariosCrud.vue
  PROPÓSITO: Este es un Componente de Vue. Se encarga de la interfaz visual (lo que ve el usuario)
  y de manejar la interacción (clics en botones, escribir en formularios).
  
  Un archivo .vue moderno se divide en 3 bloques:
  1. <script setup> (La lógica y variables - JavaScript/TypeScript)
  2. <template> (La estructura visual - HTML)
  3. <style scoped> (El diseño visual - CSS)
-->

<script setup lang="ts">
// ==========================================
// 1. IMPORTACIONES
// ==========================================
// 'ref' es una función de Vue para crear variables reactivas (que actualizan la pantalla automáticamente al cambiar).
// 'onMounted' es una función que se ejecuta sola apenas el componente aparece en la pantalla del usuario.
import { ref, onMounted } from 'vue'

// Importamos nuestro "mensajero" para poder hablar con el backend
import { usuariosService } from '../services/usuarios.service'

// ==========================================
// 2. VARIABLES REACTIVAS (ESTADO)
// ==========================================
// 'usuarios' guardará la lista de usuarios que nos envíe el backend. Inicia como un arreglo vacío [].
const usuarios = ref<any[]>([])

// 'cargando' nos sirve para mostrar un texto de "Cargando..." mientras esperamos respuesta del backend.
const cargando = ref(true)

// 'error' guarda mensajes de fallo para mostrárselos al usuario (ej. backend caído).
const error = ref('')

// 'nuevoUsuario' guarda los datos exactos que el usuario escribe en las cajitas del formulario.
const nuevoUsuario = ref({
  nombre: '',
  email: ''
})

// ==========================================
// 3. FUNCIONES (MÉTODOS)
// ==========================================

// Función para pedirle la lista de usuarios al backend
const cargarUsuarios = async () => {
  cargando.value = true // Mostramos el mensaje de cargando
  error.value = ''      // Limpiamos errores anteriores si los hubiera
  try {
    // Usamos nuestro servicio para traer los datos y los guardamos en nuestra variable 'usuarios'.
    // IMPORTANTE: Para leer o modificar el valor de una variable creada con 'ref', 
    // SIEMPRE usamos '.value' en el código JavaScript (aunque en el HTML no hace falta).
    usuarios.value = await usuariosService.getAll()
  } catch (err: any) {
    // Axios guarda la respuesta de error del backend (NestJS) dentro de err.response.data.message
    // Si no existe, usamos err.message genérico.
    const mensajeError = err.response?.data?.message || err.message || 'Error al conectar con el servidor';
    error.value = mensajeError
    console.error(err)
  } finally {
    // Ya sea que falle o tenga éxito, terminamos de cargar
    cargando.value = false
  }
}

// Función que se ejecuta cuando el usuario hace clic en "Guardar"
const crearUsuario = async () => {
  try {
    // Le mandamos al backend el contenido actual del formulario
    await usuariosService.create(nuevoUsuario.value)
    
    // Si tuvo éxito, limpiamos las cajitas de texto del formulario regresándolo a su estado original
    nuevoUsuario.value = { nombre: '', email: '' }
    
    // Y volvemos a pedir la lista de usuarios al backend para que aparezca el nuevo!
    await cargarUsuarios()
  } catch (err: any) {
    // Si el backend rechaza la creación (ej. falta un campo), NestJS manda el por qué en err.response.data.message
    const mensajeError = err.response?.data?.message || err.message || 'Error al crear usuario';
    alert(Array.isArray(mensajeError) ? mensajeError.join(', ') : mensajeError)
  }
}

// Función para borrar un usuario. Recibe el 'id' numérico del que queremos eliminar
const borrarUsuario = async (id: number) => {
  // confirm() muestra una ventanita típica del navegador preguntando Aceptar/Cancelar
  if (confirm("¿Estás seguro de borrar este usuario?")) {
    try {
      // Le decimos al backend que lo borre definitivamente en la base de datos
      await usuariosService.remove(id)
      
      // Recargamos la lista visual para que el usuario desaparezca de la pantalla
      await cargarUsuarios()
    } catch (err: any) {
      const mensajeError = err.response?.data?.message || err.message || 'Error al borrar usuario';
      alert(mensajeError)
    }
  }
}

// ==========================================
// 4. CICLO DE VIDA
// ==========================================
// onMounted le dice a Vue: "Apenas termines de dibujar esta pantalla por primera vez, ejecuta este bloque"
onMounted(() => {
  // Queremos que apenas cargue la página, busque los usuarios de forma automática
  cargarUsuarios()
})
</script>

<template>
  <div class="crud-container">
    <h2>Gestión de Usuarios</h2>

    <!-- ======================================== -->
    <!-- SECCIÓN 1: FORMULARIO DE CREACIÓN        -->
    <!-- ======================================== -->
    <div class="formulario">
      <h3>Crear Nuevo Usuario</h3>
      <!-- @submit.prevent: El '.prevent' evita que el navegador recargue toda la página al dar enter (comportamiento por defecto del HTML), 
           y el '@submit' nos permite ejecutar nuestra función 'crearUsuario' -->
      <form @submit.prevent="crearUsuario">
        <div>
          <label>Nombre:</label>
          <!-- v-model es magia pura de Vue: "Sincroniza bidireccionalmente" esta caja de texto 
               con nuestra variable 'nuevoUsuario.nombre'. Si el usuario escribe aquí, la variable en 
               el código cambia al instante, y viceversa. -->
          <input v-model="nuevoUsuario.nombre" required placeholder="Ej: Juan Pérez" />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" v-model="nuevoUsuario.email" required placeholder="juan@correo.com" />
        </div>
        <button type="submit" class="btn-guardar">Guardar</button>
      </form>
    </div>

    <!-- ======================================== -->
    <!-- SECCIÓN 2: LISTA DE USUARIOS             -->
    <!-- ======================================== -->
    <div class="lista">
      <h3>Lista Actual</h3>
      
      <!-- v-if: Condicional de Vue. Dibuja este <p> en la pantalla SOLO si la variable 'cargando' es true -->
      <p v-if="cargando">Cargando datos desde http://localhost:3000...</p>
      
      <!-- v-else-if: Si no estaba cargando, pero ocurrió un error, muestra este otro texto -->
      <p v-else-if="error" class="error">{{ error }}</p>
      
      <!-- v-else: Muestra la lista final de resultados cuando no está cargando ni hay error -->
      <ul v-else>
        <!-- Si el arreglo está vacío, mostramos un aviso amistoso -->
        <li v-if="usuarios.length === 0">No hay usuarios registrados.</li>
        
        <!-- v-for: Es un bucle repetitivo. Le dice a Vue: "Por cada 'user' que encuentres 
             adentro de la lista 'usuarios', clona y dibuja este <li>" -->
        <!-- :key="user.id": Es obligatorio en Vue al usar v-for, le sirve para no confundirse 
             y saber exactamente cuál es cuál si la lista cambia de orden -->
        <li v-for="user in usuarios" :key="user.id" class="usuario-item">
          
          <!-- Los dobles bigotes {{ }} (Interpolación) nos permiten incrustar el valor de nuestras variables 
               directamente en el HTML para que el usuario las lea -->
          <span>{{ user.nombre }} ({{ user.email }})</span>
          
          <!-- @click: Escucha el evento de 'clic' del ratón y ejecuta nuestra función de borrado pasándole el ID correcto -->
          <button @click="borrarUsuario(user.id)" class="btn-borrar">Borrar</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* 
  <style scoped> significa que este diseño de CSS aplicará ÚNICA Y EXCLUSIVAMENTE a este archivo.
  Si pones un color rojo al <h2>, no afectará a los <h2> de otras páginas.
*/
.crud-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  font-family: Arial, sans-serif;
  text-align: left;
}

h2 {
  color: #2c3e50;
  text-align: center;
}

h3 {
  color: #34495e;
  margin-top: 0;
}

.formulario {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.formulario div {
  margin-bottom: 12px;
}

.formulario label {
  display: inline-block;
  width: 80px;
  color: #495057;
  font-weight: bold;
}

.formulario input {
  padding: 6px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  width: calc(100% - 90px);
}

.btn-guardar {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-guardar:hover {
  background-color: #45a049;
}

.lista {
  border-top: 1px solid #dee2e6;
  padding-top: 15px;
}

ul {
  list-style: none;
  padding: 0;
}

.usuario-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  margin-bottom: 8px;
  border-radius: 6px;
  color: #212529;
}

.btn-borrar {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-borrar:hover {
  background-color: #d9363e;
}

.error {
  color: #ff4d4f;
  background-color: #ffe6e6;
  padding: 10px;
  border-radius: 4px;
}
</style>
