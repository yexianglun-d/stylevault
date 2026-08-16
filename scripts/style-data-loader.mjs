import { pathToFileURL } from 'node:url'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import ts from 'typescript'

export async function loadStyleModule(projectRoot = process.cwd()) {
  const sourcePath = path.join(projectRoot, 'src', 'data', 'styles.ts')
  const source = await import('node:fs/promises').then((fs) => fs.readFile(sourcePath, 'utf8'))
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  }).outputText
  const tempDir = await mkdtemp(path.join(tmpdir(), 'stylevault-'))
  const tempFile = path.join(tempDir, 'styles.mjs')

  try {
    await writeFile(tempFile, compiled, 'utf8')
    return await import(`${pathToFileURL(tempFile).href}?t=${Date.now()}`)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}
