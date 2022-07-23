const Api = require('flood-api').default

const api = new Api({
  baseUrl: 'http://localhost:3000/api',
  username: process.env.FLOOD_USERNAME,
  password: process.env.FLOOD_PASSWORD
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

const escape = (path) =>
  path.replace("/", "_").trim()

const tag_pattern = /^(.*) S(\d+)$/

const buildDest = tag_in => {
  const tag_escaped = escape(tag_in)
  let res
  if (res = tag_escaped.match(tag_pattern)) {
    const [_, tag, season] = res
    return `/download/bangumi/${tag}/S${season}/`
  } else {
    return `/download/bangumi/${tag_escaped}/S1/`
  }
}


const reduce = ts => {
  const tmp = ts.reduce((acc, t) => {
    acc[t.tag] === undefined ? (acc[t.tag] = [t.hash]) : acc[t.tag].push(t.hash)
    return acc
  }, {})

  return Object.entries(tmp).map(([tag, hashes]) => ({
    hashes,
    destination: buildDest(tag),
    moveFiles: true,
    isBasePath: true,
    isCheckHash: true
  }))
}

const needsUpdate = ({ dir, tag }) => tag && dir && buildDest(tag) !== dir

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
  console.log("\n############################\n\n")


  // await Promise.all(ret.map(api.torrents.move))

  // console.log(await api.torrents.list())

  process.exit(0)
}

main()
