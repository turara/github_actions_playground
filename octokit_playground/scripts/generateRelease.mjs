// import { Octokit } from '@octokit/rest'

// const github = new Octokit({
//   auth: process.env.TURARA_PAT,
// })

// const owner = 'turara'
// const repo = 'github_actions_playground'

// const tagPrefix = 'v'

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
  const response = await github.request(
    `POST /repos/{owner}/{repo}/releases/generate-notes`,
    {
      owner: context?.repo.owner ?? owner,
      repo: context?.repo.repo ?? repo,
      tag_name: tagName,
      previous_tag_name: previousTagName,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )
  return response.data.body
}

module.exports = async ({ github, context, core }) => {
  const { TAG_PREFIX, VERSION } = process.env
  const tagName = `${TAG_PREFIX}${VERSION}`
  const latestPublishedRelease = await getLatestPublishedRelease(
    github,
    context,
    TAG_PREFIX
  )
  const previousTagName = latestPublishedRelease?.tag_name
  const releaseNotes = await generateReleaseNotes(
    github,
    context,
    tagName,
    previousTagName
  )
  core.exportVariable('releaseNotes', releaseNotes)
}
