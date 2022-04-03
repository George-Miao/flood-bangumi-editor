const Api = require('flood-api').default

const api = new Api({
  baseUrl: 'http://localhost:3000/api',
  username: process.env.USERNAME,
  password: process.env.PASSWORD
})

const map = t => {
  const tag = t.tags[0]
  const dir = t.directory
  const name = t.name
  const hash = t.hash

  return {
    hash,
    tag,
    dir,
    name
  }
}

const reduce = ts => {
  const tmp = ts.reduce((acc, t) => {
    acc[t.tag] === undefined ? (acc[t.tag] = [t.hash]) : acc[t.tag].push(t.hash)
    return acc
  }, {})

  return Object.entries(tmp).map(([tag, hashes]) => ({
    hashes,
    destination: `/download/bangumi/${tag}`,
    moveFiles: true,
    isBasePath: true,
    isCheckHash: true
  }))
}

const needsUpdate = ({ dir, tag }) => !dir.endsWith(tag)

const main = async () => {
  if (!(await api.client.connectionTest().then(r => r.isConnected))) {
    console.error('Connection failed')
    return
  }

  const ret = await api.torrents
    .list()
    .then(x => x.torrents)
    .then(x => Object.values(x))
    .then(x => x.map(map).filter(t => needsUpdate(t)))
    .then(reduce)

  console.log(ret)

  await Promise.all(ret.map(api.torrents.move))

  process.exit(0)
}

main()
