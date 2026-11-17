import pg from 'pg'

const email = process.argv[2]?.trim().toLowerCase()
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
  throw new Error('Uso: npm run staff:grant -- correo@dominio.ec')
if (!process.env.DATABASE_URL)
  throw new Error(
    'Define DATABASE_URL con una conexión administrativa de PostgreSQL, fuera de las variables VITE_.',
  )
const local = ['localhost', '127.0.0.1', '[::1]'].includes(
  new URL(process.env.DATABASE_URL).hostname,
)
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: local ? false : { rejectUnauthorized: true },
})
try {
  await client.connect()
  await client.query(
    'insert into private.staff_members(email) values($1) on conflict(email) do update set active=true',
    [email],
  )
  console.log(
    'Autorización LABFIS habilitada. La cuenta debe confirmar su correo antes de registrar.',
  )
} finally {
  await client.end()
}
