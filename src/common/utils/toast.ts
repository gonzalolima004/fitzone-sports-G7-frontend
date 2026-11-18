import { toast, type ToastOptions } from 'vue3-toastify'

const defaultOptions: ToastOptions = {
  position: 'bottom-right',
}

export const notify = {
  success: (msg: string, options?: ToastOptions) =>
    toast.success(msg, { ...options, ...defaultOptions }),
  error: (msg: string, options?: ToastOptions) =>
    toast.error(msg, { ...options, ...defaultOptions }),
  warning: (msg: string, options?: ToastOptions) =>
    toast.warning(msg, { ...options, ...defaultOptions }),
  info: (msg: string, options?: ToastOptions) =>
    toast.info(msg, { ...options, ...defaultOptions }),
}

export { toast }
export default toast
