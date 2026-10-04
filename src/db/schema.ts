import { boolean, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Ficha } from "@/lib/regras";

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuario: text("usuario").notNull().unique(),
  nome: text("nome").notNull(),
  senhaHash: text("senha_hash").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const sessoes = pgTable("sessoes", {
  // Guarda só o hash do token; o token em si fica apenas no cookie do navegador.
  id: text("id").primaryKey(),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
});

export const campanhas = pgTable("campanhas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  mestreId: uuid("mestre_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  codigo: text("codigo").notNull().unique(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// O Mestre também é registrado como membro da própria campanha.
export const membros = pgTable(
  "campanha_membros",
  {
    campanhaId: uuid("campanha_id")
      .notNull()
      .references(() => campanhas.id, { onDelete: "cascade" }),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    entrouEm: timestamp("entrou_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.campanhaId, t.usuarioId] })],
);

export const fichas = pgTable("fichas", {
  id: uuid("id").primaryKey().defaultRandom(),
  donoId: uuid("dono_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  // Sem campanha, a ficha é particular. Com campanha, "visivel" decide se os outros jogadores a veem.
  campanhaId: uuid("campanha_id").references(() => campanhas.id, { onDelete: "set null" }),
  visivel: boolean("visivel").notNull().default(true),
  dados: jsonb("dados").$type<Ficha>().notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
});
