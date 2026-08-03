#!/usr/bin/env node

/**
 * Upload assets to an existing GitHub release.
 * Usage: GITHUB_TOKEN=ghp_xxx node scripts/upload-assets.js
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const OWNER = process.env.GITHUB_OWNER || 'sepiocorp'
const REPO = process.env.GITHUB_REPO || 'shikola.timetable.app'
const API_BASE = process.env.GITHUB_API_BASE || 'api.github.com'
const TAG = 'v1.4.0'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
if (!GITHUB_TOKEN) {
  console.error('ERROR: Set GITHUB_TOKEN env var')
  process.exit(1)
}

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
        'User-Agent': 'shikola-timetable-creator-upload',
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
        'User-Agent': 'shikola-timetable-creator-upload',
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
  console.log(`Getting release ${TAG}...`)
  const release = await githubRequest('GET', `/releases/tags/${TAG}`)
  console.log(`Found release: ${release.html_url}`)
  
  const uploadUrl = release.upload_url.replace(/\{.*\}/, '')
  
  const distDir = path.join(__dirname, '..', 'dist-electron')
  if (!fs.existsSync(distDir)) {
    console.error('dist-electron/ not found')
    process.exit(1)
  }

  const assetExts = ['.exe', '.nsis.7z', '.yml', '.blockmap']
  const skipFiles = ['builder-debug.yml', 'builder-effective-config.yaml']
  const files = fs.readdirSync(distDir).filter(f =>
    assetExts.some(ext => f.endsWith(ext)) && !skipFiles.includes(f)
  )

  // Filter out already uploaded assets
  const existingAssetNames = new Set(release.assets.map(a => a.name))
  const filesToUpload = files.filter(f => !existingAssetNames.has(f))

  // Prioritize setup exe over portable
  filesToUpload.sort((a, b) => {
    if (a.includes('Setup') && !b.includes('Setup')) return -1
    if (!a.includes('Setup') && b.includes('Setup')) return 1
    return 0
  })

  if (filesToUpload.length === 0) {
    console.log('All assets already uploaded')
  } else {
    for (const file of filesToUpload) {
      const filePath = path.join(distDir, file)
      const stat = fs.statSync(filePath)
      console.log(`Uploading ${file} (${(stat.size / 1024 / 1024).toFixed(1)} MB)...`)
      await uploadAsset(uploadUrl, filePath, file)
      console.log(`Done: ${file}`)
    }
  }

  console.log('\nUpload complete!')
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
