const { createServer } = require('node:http')
const { existsSync, readFileSync, statSync } = require('node:fs')
const path = require('node:path')
const { chromium } = require('@playwright/test')

const host = '127.0.0.1'
const port = 4173
const outDir = path.join(__dirname, '..', 'out')

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent((urlPath || '/').split('?')[0])
  const normalized = path.normalize(cleanPath).replace(/^(\.\.[\\/])+/, '')
  const base = path.join(outDir, normalized)
  const candidates = [base, `${base}.html`, path.join(base, 'index.html'), path.join(outDir, '404.html')]
  for (const file of candidates) {
    if (existsSync(file) && statSync(file).isFile()) return file
  }
  return null
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const file = resolveFile(req.url)
      if (!file) {
        res.statusCode = 404
        res.end('Not Found')
        return
      }
      res.statusCode = file.endsWith('404.html') ? 404 : 200
      const ext = path.extname(file).toLowerCase()
      res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream')
      res.end(readFileSync(file))
    })
    server.listen(port, host, () => resolve(server))
    server.on('error', reject)
  })
}

;(async () => {
  const server = await startServer()
  const browser = await chromium.launch({ headless: true })

  try {
    const context = await browser.newContext()
    await context.addInitScript(() => {
      window.__TAURI_INTERNALS__ = {}
    })
    const page = await context.newPage()

    // Simulate no internet to backend while keeping desktop app loaded from local static files.
    await page.route('**/*', async (route) => {
      const url = route.request().url()
      if (url.includes('supabase')) {
        await route.abort()
        return
      }
      await route.continue()
    })

    await page.goto(`http://${host}:${port}/auth/login`)
    await page.evaluate(() => localStorage.setItem('app-session', 'offline-test-session'))
    await page.goto(`http://${host}:${port}/dashboard/settings`)

    const categoryName = `OfflineCat-${Date.now()}`
    await page.getByPlaceholder('Nombre de la categoría').fill(categoryName)
    await page.getByRole('button', { name: 'Agregar' }).click()

    await page.getByText('Categoría creada correctamente').waitFor({ state: 'visible', timeout: 8000 })

    await page.reload()
    await page.getByText(categoryName).waitFor({ state: 'visible', timeout: 8000 })

    console.log(`OFFLINE_UI_OK toast=visible persisted_category=${categoryName}`)
    await context.close()
  } finally {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
