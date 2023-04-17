// const { Octokit } = require('@octokit/rest')
// const github = new Octokit({
//   auth: process.env.TURARA_PAT,
// })
// ;(async () => {
//   const owner = 'turara'
//   const repo = 'github_actions_playground'
//   const context = undefined
//   const TAG_PREFIX = 'v'
//   const VERSION = '1.0.15'
//   const tagName = `${TAG_PREFIX}${VERSION}`
//   const latestPublishedRelease = await getLatestPublishedRelease(
//     github,
//     context,
//     TAG_PREFIX,
//     owner,
//     repo
//   )
//   const previousTagName =
//     latestPublishedRelease?.tag_name ?? `${TAG_PREFIX}0.0.1`
//   const releaseNotes = await generateReleaseNotes(
//     github,
//     context,
//     tagName,
//     previousTagName,
//     owner,
//     repo
//   )
//   await generateRelease(github, context, tagName, releaseNotes, owner, repo)
// })()

const getLatestPublishedRelease = async (
  github,
  context,
  tagPrefix,
  owner = undefined,
  repo = undefined
) => {
  let latestPublishedRelease = undefined
  let page = 1
  while (latestPublishedRelease === undefined) {
    const response = await github.rest.repos.listReleases({
      owner: context?.repo.owner ?? owner,
      repo: context?.repo.repo ?? repo,
      per_page: 1,
      page: page++,
    })
    if (response.data.length === 0) {
      break
    }
    latestPublishedRelease = response.data.find(
      (release) => !release.draft && release.tag_name?.startsWith(tagPrefix)
    )
  }
  return latestPublishedRelease
}

const generateReleaseNotes = async (
  github,
  context,
  tagName,
  previousTagName,
  owner = undefined,
  repo = undefined
) => {
  const response = await github.rest.repos.generateReleaseNotes({
    owner: context?.repo.owner ?? owner,
    repo: context?.repo.repo ?? repo,
    tag_name: tagName,
    previous_tag_name: previousTagName,
  })
  return response.data.body
}

const generateRelease = async (
  github,
  context,
  tagName,
  body,
  owner = undefined,
  repo = undefined
) => {
  await github.rest.repos.createRelease({
    owner: context?.repo.owner ?? owner,
    repo: context?.repo.repo ?? repo,
    tag_name: tagName,
    name: `Release ${tagName}`,
    body,
    draft: true,
  })
}

module.exports = async ({ github, context, core }) => {
  const { TAG_PREFIX, VERSION } = process.env
  const tagName = `${TAG_PREFIX}${VERSION}`
  const latestPublishedRelease = await getLatestPublishedRelease(
    github,
    context,
    TAG_PREFIX
  )
  const previousTagName =
    latestPublishedRelease?.tag_name ?? `${TAG_PREFIX}0.0.1`
  const releaseNotes = await generateReleaseNotes(
    github,
    context,
    tagName,
    previousTagName
  )
  await generateRelease(github, context, tagName, releaseNotes)
  // core.exportVariable('releaseNotes', releaseNotes)
}
