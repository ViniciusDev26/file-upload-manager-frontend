import { Header } from "@/components/header";
import { Outlet } from "react-router-dom";

export const RootLayout = () => {
	return (
		<div className="max-h-screen h-screen overflow-hidden">
			<Header />

			<div className="mx-auto h-full">
				<Outlet />
			</div>
		</div>
	);
};
