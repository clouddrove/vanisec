// The FAQ used to exist twice: once as the visible page and once as a
// hand-written FAQPage schema in components/StructuredData.tsx. They drifted,
// and the drift was invisible because only one of them renders as text. When
// the password stopped being optional the page was eventually corrected and the
// schema was not, so the answer Google surfaced stayed wrong.
//
// Both now read lib/faqs.ts. These tests exist to keep it that way, and to
// catch the specific class of error that caused it: an answer that contradicts
// what the API actually does.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FAQS } from '@/lib/faqs'

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('every entry has a question and an answer', () => {
  assert.ok(FAQS.length >= 12)
  for (const faq of FAQS) {
    assert.ok(faq.question.trim().length > 0)
    assert.ok(faq.answer.trim().length > 0)
    assert.ok(faq.question.trim().endsWith('?'), `not a question: ${faq.question}`)
  }
})

test('questions are unique', () => {
  const seen = new Set(FAQS.map((f) => f.question.toLowerCase()))
  assert.equal(seen.size, FAQS.length, 'a duplicated question means the list was edited twice')
})

test('neither consumer restates the list', () => {
  // The failure being prevented: someone adds a question to one and not the
  // other, and the two disagree until a human happens to read both.
  for (const file of ['app/faq/page.tsx', 'components/StructuredData.tsx']) {
    const src = read(file)
    assert.match(src, /from '@\/lib\/faqs'/, `${file} should import the shared list`)
    assert.ok(
      !/'@type': 'Question',\s*\n\s*name: '/.test(src),
      `${file} restates the FAQ instead of mapping over it`
    )
  }
})

test('the answers do not claim the password is optional', () => {
  // app/api/secrets/route.ts refuses a create without one. Three separate
  // places once said otherwise, which is the error this guards.
  const requiresPassword = read('app/api/secrets/route.ts').includes("'Password is required'")
  assert.ok(requiresPassword, 'the API no longer requires a password; this test needs revisiting')

  for (const faq of FAQS) {
    const text = `${faq.answer} ${faq.schemaAnswer ?? ''}`.toLowerCase()
    if (!/password|passphrase/.test(text)) continue
    assert.ok(
      !/(password|passphrase)[^.]{0,40}\b(is )?optional/.test(text),
      `answer calls the password optional: ${faq.question}`
    )
  }
})

test('the clipboard is covered', () => {
  const mentions = FAQS.filter((f) => /clipboard/i.test(`${f.question} ${f.answer}`))
  assert.ok(mentions.length >= 3, 'the clipboard is a primary feature and needs explaining')
})
