import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { Helmet, HelmetProvider } from "react-helmet-async";

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <HelmetProvider>
        <Helmet titleTemplate="%s | File Manager Tool"/>
        <RouterProvider router={router} />
        <Toaster richColors />
      </HelmetProvider>
    </ThemeProvider> 
  )
}
