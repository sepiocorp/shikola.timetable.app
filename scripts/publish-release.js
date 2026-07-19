#!/usr/bin/env node

/**
 * Publish a GitHub release for Shikola Timetable Creator.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/publish-release.js              # create release only
 *   GITHUB_TOKEN=ghp_xxx node scripts/publish-release.js --upload     # create release + upload built assets
 *   GITHUB_TOKEN=ghp_xxx node scripts/publish-release.js --draft      # create as draft (not published)
 *   GITHUB_TOKEN=ghp_xxx node scripts/publish-release.js --prerelease # create as prerelease
 *
 * Requirements:
 *   - A GitHub Personal Access Token with "repo" scope
 *   - Run `npm run dist` first if using --upload (builds to dist-electron/)
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const OWNER = 'sepiocorp'
const REPO = 'shikola.timetable.app'
const API_BASE = 'api.github.com'

// --- Parse CLI args ---
const args = process.argv.slice(2)
const uploadAssets = args.includes('--upload')
const isDraft = args.includes('--draft')
const isPrerelease = args.includes('--prerelease')

// --- Validate token ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
if (!GITHUB_TOKEN) {
  console.error('ERROR: Set GITHUB_TOKEN env var (needs "repo" scope).')
  console.error('  Example: set GITHUB_TOKEN=ghp_xxx&& node scripts/publish-release.js')
  process.exit(1)
}

// --- Read package.json ---
const pkgPath = path.join(__dirname, '..', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
const version = pkg.version
const codename = pkg.codename || ''
const tagName = `v${version}`

console.log(`Publishing release ${tagName} (${codename}) to ${OWNER}/${REPO}...`)

// --- Extract latest changelog section from CHANGELOG.md ---
function extractLatestChangelog() {
  const mdPath = path.join(__dirname, '..', 'CHANGELOG.md')
  const md = fs.readFileSync(mdPath, 'utf-8')

  // Match the first "## [x.y.z] — ..." section
  const sectionRegex = /^## \[[\d.]+\].*$/m
  const match = md.match(sectionRegex)
  if (!match) return `Release v${version}`

  const startIdx = match.index
  const nextSectionIdx = md.indexOf('\n## [', startIdx + 1)
  const endIdx = nextSectionIdx === -1 ? md.length : nextSectionIdx

  return md.slice(startIdx, endIdx).trim()
}

const releaseBody = extractLatestChangelog()

// --- GitHub API helper ---
function githubRequest(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const options = {
      hostname: API_BASE,
      path: `/repos/${OWNER}/${REPO}${urlPath}`,
      method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'shikola-timetable-creator-publish',
        ...headers,
      },
    }
    if (data) {
      options.headers['Content-Type'] = headers['Content-Type'] || 'application/json'
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

// --- Upload asset to release (uses different upload URL) ---
function uploadAsset(uploadUrl, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath)
    const url = new URL(uploadUrl)
    const options = {
      hostname: url.hostname,
      path: `${url.pathname}?name=${encodeURIComponent(fileName)}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'shikola-timetable-creator-publish',
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

// --- Main ---
async function main() {
  // 1. Check if release already exists
  try {
    const existing = await githubRequest('GET', `/releases/tags/${tagName}`)
    if (existing.id) {
      console.error(`Release ${tagName} already exists (id: ${existing.id}). Delete it first or bump version.`)
      process.exit(1)
    }
  } catch (err) {
    // 404 is expected — release doesn't exist yet
  }

  // 2. Create the release
  console.log('Creating release...')
  const release = await githubRequest('POST', '/releases', {
    tag_name: tagName,
    name: `v${version} — ${codename}`,
    body: releaseBody,
    draft: isDraft,
    prerelease: isPrerelease,
  })

  console.log(`Release created: ${release.html_url}`)

  // 3. Optionally upload built assets
  if (uploadAssets) {
    const distDir = path.join(__dirname, '..', 'dist-electron')
    if (!fs.existsSync(distDir)) {
      console.error('dist-electron/ not found. Run "npm run dist" first.')
      process.exit(1)
    }

    const assetExts = ['.exe', '.nsis.7z', '.yml']
    const files = fs.readdirSync(distDir).filter(f =>
      assetExts.some(ext => f.endsWith(ext))
    )

    if (files.length === 0) {
      console.log('No installable assets found in dist-electron/')
    } else {
      const uploadUrl = release.upload_url.replace(/\{.*\}/, '')
      for (const file of files) {
        const filePath = path.join(distDir, file)
        const stat = fs.statSync(filePath)
        console.log(`  Uploading ${file} (${(stat.size / 1024 / 1024).toFixed(1)} MB)...`)
        await uploadAsset(uploadUrl, filePath, file)
        console.log(`  Done: ${file}`)
      }
    }
  }

  console.log('\nRelease published successfully!')
  if (!isDraft) {
    console.log(`Users will see this update via Help → Check for Updates.`)
  }
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
