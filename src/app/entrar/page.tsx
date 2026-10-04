import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { FormulariosEntrada } from "./formularios";

export default async function PaginaEntrar() {
  if (await usuarioAtual()) redirect("/");
  return <FormulariosEntrada pedeCodigo={!!process.env.CODIGO_GRUPO} />;
}
