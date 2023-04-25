const createTagIfNotExist = async (github, context, tagName) => {
  try {
    await github.rest.git.getRef({
      owner: context?.repo.owner ?? '',
      repo: context?.repo.repo ?? '',
      ref: `tags/${tagName}`,
    })
  } catch (error) {
    console.log('createTagIfNotExist', error)
    if (error.status === 404) {
      await github.rest.git.createRef({
        owner: context?.repo.owner ?? '',
        repo: context?.repo.repo ?? '',
        ref: `refs/tags/${tagName}`,
        sha: context?.sha ?? '',
      })
    }
  }
}

const getLatestPublishedRelease = async (github, context, tagPrefix) => {
  let latestPublishedRelease = undefined
  let page = 1
  while (latestPublishedRelease === undefined) {
    const response = await github.rest.repos.listReleases({
      owner: context?.repo.owner ?? '',
      repo: context?.repo.repo ?? '',
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
  previousTagName
) => {
  const response = await github.rest.repos.generateReleaseNotes({
    owner: context?.repo.owner ?? '',
    repo: context?.repo.repo ?? '',
    tag_name: tagName,
    previous_tag_name: previousTagName,
  })
  return response.data.body
}

const generateRelease = async (github, context, tagName, body) => {
  await github.rest.repos.createRelease({
    owner: context?.repo.owner ?? '',
    repo: context?.repo.repo ?? '',
    tag_name: tagName,
    name: `Release ${tagName}`,
    body,
    draft: true,
  })
}

module.exports = async ({ github, context, core }) => {
  const { TAG_PREFIX, VERSION } = process.env
  const tagName = `${TAG_PREFIX}${VERSION}`
  await createTagIfNotExist(github, context, tagName)
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

// const { Octokit } = require('@octokit/rest')
// const github = new Octokit({
//   auth: process.env.TURARA_PAT,
// })

// ;(async () => {
//   const owner = 'turara'
//   const repo = 'github_actions_playground'
//   const context = { sha: 'sha', repo: { owner, repo } }
//   const TAG_PREFIX = 'v'
//   const VERSION = '1.1.0'
//   const tagName = `${TAG_PREFIX}${VERSION}`
//   await createTagIfNotExist(github, context, tagName)
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
