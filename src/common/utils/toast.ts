import { toast, type ToastOptions } from 'vue3-toastify'

export const notify = {
  success: (msg: string, options?: ToastOptions) => toast.success(msg, options),
  error: (msg: string, options?: ToastOptions) => toast.error(msg, options),
  warning: (msg: string, options?: ToastOptions) => toast.warning(msg, options),
  info: (msg: string, options?: ToastOptions) => toast.info(msg, options),
}

export { toast }
export default toast
