import { utils, BigNumber } from 'ethers'
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'

function hashLeaf([address, entry]) {
  return utils.solidityKeccak256(['address', 'uint256'], [address, entry.balance])
}

export function getEntryProofIndex(address: string, entry: any, proof: any) {
  let index = 0
  let computedHash = hashLeaf([address, entry])

  for (let i = 0; i < proof.length; i++) {
    index *= 2
    const proofElement = proof[i]

    if (computedHash <= proofElement) {
      // Hash(current computed hash + current element of the proof)
      computedHash = utils.solidityKeccak256(['bytes32', 'bytes32'], [computedHash, proofElement])
    } else {
      // Hash(current element of the proof + current computed hash)
      computedHash = utils.solidityKeccak256(['bytes32', 'bytes32'], [proofElement, computedHash])
      index += 1
    }
  }
  return index
}

// TODO: use github repo url once live
const baseUrl = `https://gist.githubusercontent.com/miguelmota/86814b3bcd0bb8ffbd5b4fa9d1cb52ba/raw/a633c647f657b9a2c436ac8e8b8e11b805bba87a`

class ShardedMerkleTree {
  fetcher: any
  shardNybbles: any
  root: any
  total: any
  shards: any
  trees: any

  constructor(fetcher: any, shardNybbles: any, root: any, total: any) {
    this.fetcher = fetcher
    this.shardNybbles = shardNybbles
    this.root = root
    this.total = total
    this.shards = {}
    this.trees = {}

    this.init()
    .catch((err: any) => {
      console.error(err)
    })
  }

  async init() {
  }

  static async fetchRootFile() {
    const url = `${baseUrl}/root.json`
    const res = await fetch(url)
    const rootFile = await res.json()
    const { root, shardNybbles, total } = rootFile
    return {
      root,
      shardNybbles,
      total
    }
  }

  async getProof(address: string) {
    console.log(`address:`, address)
    const shardid = address.slice(2, 2 + this.shardNybbles).toLowerCase()
    console.log(`shardid:`, shardid)

    let shard = this.shards[shardid]

    if (shard === undefined) {
      shard = this.shards[shardid] = await this.fetcher(shardid)
      this.trees[shardid] = new MerkleTree(Object.entries(shard.entries).map(hashLeaf), keccak256, {
        sort: true,
      })
      console.log(`this.trees[${shardid} (shardid)]:`, this.trees[shardid])
    }
    console.log(`shard:`, shard)

    const entry = shard.entries[address]
    console.log(`entry:`, entry)
    if (!entry) {
      throw new Error('Invalid Entry')
    }

    const leaf = hashLeaf([address, entry])
    console.log(`leaf:`, leaf)

    const proof = this.trees[shardid].getProof(leaf).map((entry: any) => '0x' + entry.data.toString('hex'))
    console.log(`proof:`, proof)

    return [entry, proof.concat(shard.proof)]
  }

  async fetchProof(address :string) {
    console.log(`address:`, address)
    const shardid = address.slice(2, 2 + this.shardNybbles).toLowerCase()
    console.log(`shardid:`, shardid)
    let shard = this.shards[shardid]

    if (shard === undefined) {
      shard = this.shards[shardid] = await this.fetcher(shardid)
      this.trees[shardid] = new MerkleTree(Object.entries(shard.entries).map(hashLeaf), keccak256, {
        sort: true,
      })
      console.log(`this.trees[${shardid} (shardid)]:`, this.trees[shardid])
    }
    console.log(`shard:`, shard)

    const entry = shard.entries[address]
    console.log(`entry:`, entry)

    if (!entry) {
      throw new Error('Invalid Entry')
    }
    const leaf = hashLeaf([address, entry])
    console.log(`leaf:`, leaf)

    const proof = this.trees[shardid].getProof(leaf).map((entry: any) => '0x' + entry.data.toString('hex'))
    console.log(`proof:`, proof)

    return [entry, proof.concat(shard.proof)]
  }

  static build (entries: any, shardNybbles: any) {
    const shards = {}
    let total = BigNumber.from(0)
    for (const [address, entry] of entries) {
      const shard = address.slice(2, 2 + shardNybbles).toLowerCase()
      if (shards[shard] === undefined) {
        shards[shard] = []
      }
      shards[shard].push([address, entry])
      total = total.add(entry.balance)
    }
    const roots = Object.fromEntries(
      Object.entries(shards).map(([shard, entries]: any) => [
        shard,
        new MerkleTree(entries.map(hashLeaf), keccak256, { sort: true }).getRoot(),
      ])
    )
    const tree = new MerkleTree(Object.values(roots), keccak256, { sort: true })
    console.log(`tree:`, tree)
  }

  static async fetchTree() {
    const { root, shardNybbles, total } = await ShardedMerkleTree.fetchRootFile()
    return new ShardedMerkleTree(
      async (shard: any) => {
        const url = `${baseUrl}/${shard}.json`
        const res = await fetch(url)
        if (res.status === 404) {
          throw new Error('Invalid Entry')
        }
        return res.json()
      },
      shardNybbles,
      root,
      BigNumber.from(total)
    )
  }
}

export { ShardedMerkleTree }