#!/usr/bin/env node

/**
 * Update an existing GitHub release: upload assets and/or delete unwanted assets.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/update-release.js --release-id 356278757
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const OWNER = 'sepiocorp'
const REPO = 'shikola.timetable.app'

const args = process.argv.slice(2)
let releaseId = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--release-id' && args[i + 1]) {
    releaseId = args[i + 1]
  }
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
if (!GITHUB_TOKEN) {
  console.error('ERROR: Set GITHUB_TOKEN env var.')
  process.exit(1)
}
if (!releaseId) {
  console.error('ERROR: Provide --release-id')
  process.exit(1)
}

function api(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}${urlPath}`,
      method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'shikola-publish',
        ...headers,
      },
    }
    if (data) {
      options.headers['Content-Type'] = 'application/json'
      options.headers['Content-Length'] = Buffer.byteLength(data)
    }
    const req = https.request(options, (res) => {
      let chunks = ''
      res.on('data', (d) => { chunks += d })
      res.on('end', () => {
        const json = chunks ? JSON.parse(chunks) : {}
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(json)
        } else {
          reject(new Error(`GitHub API ${res.statusCode}: ${json.message || chunks}`))
        }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

function uploadAsset(uploadUrl, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath)
    const url = new URL(uploadUrl)
    // Workaround: uploads.github.com may not resolve via local DNS; use known IP
    const hostname = url.hostname
    const ipOverride = hostname === 'uploads.github.com' ? '140.82.121.13' : hostname
    const options = {
      hostname: ipOverride,
      path: `${url.pathname}?name=${encodeURIComponent(fileName)}`,
      method: 'POST',
      headers: {
        'Host': hostname,
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'shikola-publish',
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileData.length,
      },
    }
    const req = https.request(options, (res) => {
      let chunks = ''
      res.on('data', (d) => { chunks += d })
      res.on('end', () => {
        const json = chunks ? JSON.parse(chunks) : {}
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(json)
        } else {
          reject(new Error(`Upload ${res.statusCode}: ${json.message || chunks}`))
        }
      })
    })
    req.on('error', reject)
    req.write(fileData)
    req.end()
  })
}

async function main() {
  // 1. Get existing assets
  const assets = await api('GET', `/releases/${releaseId}/assets`)
  console.log('Current assets:', assets.map(a => a.name).join(', ') || '(none)')

  // 2. Delete only source code archives (GitHub auto-generates these)
  for (const asset of assets) {
    const name = asset.name.toLowerCase()
    if (name.includes('source code')) {
      console.log(`  Deleting ${asset.name}...`)
      await api('DELETE', `/releases/assets/${asset.id}`)
      console.log(`  Deleted ${asset.name}`)
    }
  }

  // 3. Upload installers (skip files already on the release)
  const distDir = path.join(__dirname, '..', 'dist-electron')
  if (!fs.existsSync(distDir)) {
    console.error('dist-electron/ not found. Run "npm run dist" first.')
    process.exit(1)
  }

  const assetExts = ['.exe', '.yml', '.blockmap']
  const files = fs.readdirSync(distDir).filter(f =>
    assetExts.some(ext => f.endsWith(ext))
  )

  // Re-fetch assets after deletions
  const remainingAssets = await api('GET', `/releases/${releaseId}/assets`)
  const existingNames = new Set(remainingAssets.map(a => a.name))

  if (files.length === 0) {
    console.log('No installable assets found in dist-electron/')
  } else {
    const release = await api('GET', `/releases/${releaseId}`)
    const uploadUrl = release.upload_url.replace(/\{.*\}/, '')

    for (const file of files) {
      // GitHub replaces spaces with dots in asset names
      const githubName = file.replace(/ /g, '.')
      if (existingNames.has(file) || existingNames.has(githubName)) {
        console.log(`  Skipping ${file} (already uploaded)`)
        continue
      }
      const filePath = path.join(distDir, file)
      const stat = fs.statSync(filePath)
      console.log(`  Uploading ${file} (${(stat.size / 1024 / 1024).toFixed(1)} MB)...`)
      await uploadAsset(uploadUrl, filePath, file)
      console.log(`  Done: ${file}`)
    }
  }

  // 4. Verify final assets
  const finalAssets = await api('GET', `/releases/${releaseId}/assets`)
  console.log('\nFinal assets:', finalAssets.map(a => a.name).join(', ') || '(none)')
  console.log(`\nRelease updated: https://github.com/sepiocorp/${REPO}/releases/tag/v1.0.7`)
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
