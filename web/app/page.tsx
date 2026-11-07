import { redirect } from "next/navigation";

export default function Home() {
  // For now, redirect straight to the login page since this is the panel app
  redirect("/login");
}
