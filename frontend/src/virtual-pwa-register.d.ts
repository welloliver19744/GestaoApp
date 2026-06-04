declare module 'virtual:pwa-register/react' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function useRegisterSW(opts?: {
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: unknown) => void
  }): {
    needRefresh: [boolean, (v: boolean) => void]
    offlineReady: [boolean, (v: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
