import { Header } from "@/components/header"
import { Outlet } from "react-router-dom"

export const RootLayout = () => {
  return (
    <div className="overflow-y-hidden">
      <Header />

      <div className="5/6">
        <Outlet />
      </div>
    </div>
  )
}