 import { Suspense } from "react"
import Navbar from "./Navbar"
export default function Home() {
  return (
  <Suspense fallback={null}>
      <Navbar />
    </Suspense>
  )
}