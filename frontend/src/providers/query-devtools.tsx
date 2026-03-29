'use client'

import { useEffect, useState, type ComponentType } from 'react'

type DevtoolsComponent = ComponentType<{ initialIsOpen?: boolean }>

export default function QueryDevtools() {
  const [Devtools, setDevtools] = useState<DevtoolsComponent | null>(null)

  useEffect(() => {
    import('@tanstack/react-query-devtools').then((mod) => {
      setDevtools(() => mod.ReactQueryDevtools as DevtoolsComponent)
    })
  }, [])

  if (!Devtools) return null
  return <Devtools initialIsOpen={false} />
}
