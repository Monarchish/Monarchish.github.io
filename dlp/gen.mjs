// 生成你自己的记忆星图：读记忆 → 塞进模板 → 输出 graph3d.html
//
// 用法：node gen.mjs
//
// 它只认同目录下的「记忆.json」。格式见 README。

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const store = join(here, '记忆.json')

if (!existsSync(store)) {
  console.error('找不到 记忆.json，它应该和这个脚本放在同一个文件夹里。')
  process.exit(1)
}

const raw = JSON.parse(readFileSync(store, 'utf8'))

const memories = (raw.memories || [])
  .filter((m) => m && m.text)
  .map((m) => ({
    id: String(m.id || m.text.slice(0, 8)),
    title: String(m.title || ''),
    html: String(m.html || ''),
    dateText: String(m.dateText || ''),
    text: String(m.text || ''),
    imp: typeof m.imp === 'number' ? m.imp : (typeof m.importance === 'number' ? m.importance : 0.5),
    at: m.at || m.createdAt || new Date().toISOString(),
    cat: m.cat || m.category || 'event',
    tags: Array.isArray(m.tags) ? m.tags : [],
    related: Array.isArray(m.related) ? m.related : [],
    key: m.key || m['事实键'] || ''
  }))

const traces = (raw.traces || []).map((t) => ({
  at: t.at, q: t.query || '', p: (t.picked || []).map(String)
}))

const payload = {
  self: raw.self || '大肥鱼',
  user: raw.user || '她',
  persons: Array.isArray(raw.persons) ? raw.persons : [],
  groups: Array.isArray(raw.groups) ? raw.groups : [],
  generatedAt: new Date().toISOString(),
  memories,
  traces
}

const tpl = readFileSync(join(here, '模板.html'), 'utf8')
const json = JSON.stringify(payload).replace(/</g, '\\u003c')
const out = tpl.replace('/*__DATA__*/ null', json)

writeFileSync(join(here, 'graph3d.html'), out, 'utf8')
console.log('✓ ' + memories.length + ' 条记忆 → graph3d.html（双击就能看）')
